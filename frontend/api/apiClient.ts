import { ApiResponse } from '../types';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<T> {
  endpoint: string;
  method?: HttpMethod;
  retries?: number;
  useMock?: boolean;
  mockHandler: () => Promise<T> | T;
  realHandler?: () => Promise<T> | T;
}

export class ServiceError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code = 'SERVICE_ERROR', retryable = false) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

const DEFAULT_RETRIES = 2;
const USE_MOCK_BY_DEFAULT = import.meta.env.VITE_USE_MOCK !== 'false';

const requestRealApi = async <T>(options: RequestOptions<T>): Promise<T> => {
  throw new ServiceError(
    `TODO: 请在 services 中对接真实 API -> ${options.method || 'GET'} ${options.endpoint}`,
    'API_NOT_IMPLEMENTED',
    false
  );
};

const buildMeta = (retryCount: number, isMock: boolean): ApiResponse<null>['meta'] => ({
  requestId: `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  timestamp: new Date().toISOString(),
  mock: isMock,
  retryCount
});

const executeWithRetry = async <T>(
  task: () => Promise<T>,
  retries: number
): Promise<{ data: T; retryCount: number }> => {
  let attempts = 0;
  let lastError: unknown = null;

  while (attempts <= retries) {
    try {
      const data = await task();
      return { data, retryCount: attempts };
    } catch (error) {
      lastError = error;
      const retryable = error instanceof ServiceError ? error.retryable : false;
      if (!retryable || attempts === retries) {
        throw error;
      }
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 300 * attempts));
    }
  }

  throw lastError;
};

export const requestWithMock = async <T>(options: RequestOptions<T>): Promise<ApiResponse<T>> => {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const isMock = options.useMock ?? USE_MOCK_BY_DEFAULT;

  try {
    const { data, retryCount } = await executeWithRetry(async () => {
      if (isMock) {
        return {
          payload: await options.mockHandler(),
          mockUsed: true
        };
      }

      try {
        const realData = options.realHandler
          ? await options.realHandler()
          : await requestRealApi<T>(options);
        return {
          payload: realData,
          mockUsed: false
        };
      } catch (error) {
        const fallbackData = await options.mockHandler();
        console.warn(
          `[apiClient] ${options.endpoint} 真实 API 不可用，已回退到预置数据`,
          error
        );
        return {
          payload: fallbackData,
          mockUsed: true
        };
      }
    }, retries);

    return {
      code: 0,
      data: data.payload,
      message: data.mockUsed ? '数据加载成功' : '请求成功',
      success: true,
      meta: buildMeta(retryCount, data.mockUsed)
    };
  } catch (error) {
    const retryCount = retries;
    const serviceError =
      error instanceof ServiceError
        ? error
        : new ServiceError('服务请求失败，请稍后重试', 'UNKNOWN_ERROR', false);

    return {
      code: -1,
      data: null as T,
      message: serviceError.message,
      success: false,
      meta: buildMeta(retryCount, isMock)
    };
  }
};

export const unwrapResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new ServiceError(response.message, 'REQUEST_FAILED', false);
  }
  return response.data;
};
