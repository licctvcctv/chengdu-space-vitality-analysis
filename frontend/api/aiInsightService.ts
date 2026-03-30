import { delay } from '../utils/delay';
import {
  ComparisonAiInsight,
  DataCleaningAiInsight,
  ForecastAiInsight,
  ReportAiNarrative,
  ReportItem
} from '../types';
import { requestWithMock, ServiceError, unwrapResponse } from './apiClient';

interface SiliconFlowChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface DataCleaningPayload {
  raw: number;
  spam: number;
  dup: number;
  valid: number;
  bufferUsage: number;
  recentLogs: string[];
}

interface ComparisonInsightPayload {
  topicA: string;
  topicB: string;
  radarDataA: number[];
  radarDataB: number[];
  trendData: Array<{
    time: string;
    valueA: number;
    valueB: number;
  }>;
}

interface ForecastInsightPayload {
  topic: string;
  peakTime: string;
  peakValue: number;
  confidence: number;
  recentActual: number[];
  futurePredicted: number[];
}

const SILICONFLOW_API_BASE_URL = (import.meta.env.VITE_SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/$/, '');
const SILICONFLOW_API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY || '';
const SILICONFLOW_MODEL =
  import.meta.env.VITE_SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';
const ENABLE_REAL_AI =
  Boolean(SILICONFLOW_API_KEY) &&
  (import.meta.env.VITE_USE_SILICONFLOW === 'true' || import.meta.env.VITE_USE_MOCK === 'false');

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const tryParseJson = (rawText: string): unknown => {
  try {
    return JSON.parse(rawText);
  } catch (error) {
    return null;
  }
};

const extractJsonPayload = (content: string): unknown => {
  const direct = tryParseJson(content);
  if (direct) return direct;

  const fencedJsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJsonMatch?.[1]) {
    const fenced = tryParseJson(fencedJsonMatch[1].trim());
    if (fenced) return fenced;
  }

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const maybeJson = tryParseJson(content.slice(firstBrace, lastBrace + 1));
    if (maybeJson) return maybeJson;
  }

  return null;
};

const ensureStringArray = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const result = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  return result.length > 0 ? result : fallback;
};

const buildDataCleaningFallback = (payload: DataCleaningPayload): DataCleaningAiInsight => {
  const filteredRate = payload.raw > 0 ? (payload.spam / payload.raw) * 100 : 0;
  const duplicateRate = payload.raw > 0 ? (payload.dup / payload.raw) * 100 : 0;
  const validRate = payload.raw > 0 ? (payload.valid / payload.raw) * 100 : 0;
  const stabilityPenalty = payload.bufferUsage > 80 ? 16 : payload.bufferUsage > 65 ? 8 : 0;
  const score = clampScore(validRate - filteredRate * 0.4 - duplicateRate * 0.3 - stabilityPenalty + 25);

  return {
    score,
    summary: `当前清洗链路综合评分 ${score}/100，入库有效率 ${validRate.toFixed(1)}%，建议继续关注异常薪资与敏感词命中样本。`,
    risks: [
      `低质量岗位过滤比例 ${filteredRate.toFixed(1)}%，仍有提升空间。`,
      `重复岗位占比 ${duplicateRate.toFixed(1)}%，需持续优化去重规则。`,
      payload.bufferUsage > 75 ? `Spark 缓冲池占用 ${payload.bufferUsage}% 偏高，存在峰值抖动风险。` : '当前缓冲池占用稳定，可维持当前任务并发。'
    ],
    suggestions: [
      '优先复核“薪资跨度异常 + 敏感词命中”的交叉样本，降低误放行。',
      '增加岗位描述结构化校验（学历、经验、薪资字段完整性）。',
      '按城市与岗位类别分层监控清洗命中率，避免全局阈值过粗。'
    ],
    generatedAt: new Date().toISOString(),
    model: SILICONFLOW_MODEL
  };
};

const buildReportFallback = (report: ReportItem): ReportAiNarrative => {
  const summary = report.summary;
  if (!summary) {
    return {
      summary: '当前报表缺少结构化摘要数据，建议重新生成后再进行 AI 解读。',
      highlights: ['暂无可用指标'],
      actions: ['重新生成周报或月报'],
      generatedAt: new Date().toISOString(),
      model: SILICONFLOW_MODEL
    };
  }

  const topCity = summary.cityRanking[0];
  const topIndustry = summary.industryRanking[0];
  const topSkill = summary.skillHeatChanges[0];

  return {
    summary: `本期总岗位 ${summary.coreMetrics.totalJobs.toLocaleString()}，新增岗位 ${summary.coreMetrics.newJobs.toLocaleString()}，平均薪资 ${summary.coreMetrics.avgSalaryK}K。`,
    highlights: [
      `城市需求第一：${topCity?.name || '暂无'}（指数 ${topCity?.value || 0}）`,
      `行业需求第一：${topIndustry?.name || '暂无'}（占比 ${topIndustry?.value || 0}%）`,
      `技能热度增长最快：${topSkill?.skill || '暂无'}（+${topSkill?.delta || 0}%）`
    ],
    actions: [
      '优先在高需求城市增加核心岗位曝光位。',
      '针对高增长技能更新 JD 关键词与筛选条件。',
      `重点跟进风险提示：${summary.riskAlerts[0] || '暂无'}`
    ],
    generatedAt: new Date().toISOString(),
    model: SILICONFLOW_MODEL
  };
};

const buildComparisonFallback = (payload: ComparisonInsightPayload): ComparisonAiInsight => {
  const avgA = payload.radarDataA.length
    ? payload.radarDataA.reduce((sum, value) => sum + value, 0) / payload.radarDataA.length
    : 0;
  const avgB = payload.radarDataB.length
    ? payload.radarDataB.reduce((sum, value) => sum + value, 0) / payload.radarDataB.length
    : 0;
  const trendLast = payload.trendData[payload.trendData.length - 1];
  const trendDiff = trendLast ? trendLast.valueA - trendLast.valueB : 0;

  return {
    summary:
      avgA >= avgB
        ? `${payload.topicA} 在综合维度上略优于 ${payload.topicB}，建议优先投递与其技能栈一致的核心岗位。`
        : `${payload.topicB} 在综合维度上略优于 ${payload.topicA}，建议根据个人项目经历选择更匹配方向。`,
    advantagesA: [
      `${payload.topicA} 雷达维度平均分 ${avgA.toFixed(1)}，在岗位热度与成长性上表现稳定。`,
      trendDiff >= 0
        ? `${payload.topicA} 近期需求走势高于 ${payload.topicB}，招聘窗口更活跃。`
        : `${payload.topicA} 近期需求增长偏缓，建议强化差异化技能优势。`
    ],
    advantagesB: [
      `${payload.topicB} 雷达维度平均分 ${avgB.toFixed(1)}，在薪资竞争力与岗位稳定性上表现突出。`,
      trendDiff <= 0
        ? `${payload.topicB} 近期需求走势高于 ${payload.topicA}，岗位竞争热度更高。`
        : `${payload.topicB} 需求增速低于 ${payload.topicA}，建议关注细分岗位方向。`
    ],
    suggestions: [
      `若目标为快速拿到面试机会，可优先选择 ${trendDiff >= 0 ? payload.topicA : payload.topicB} 方向。`,
      '简历中建议分别强化“业务成果量化”与“关键技能闭环项目”两类证据。',
      '面试准备时重点对比两方向的核心技能栈，提前补齐缺口。'
    ],
    generatedAt: new Date().toISOString(),
    model: SILICONFLOW_MODEL
  };
};

const buildForecastFallback = (payload: ForecastInsightPayload): ForecastAiInsight => {
  const actualTail = payload.recentActual[payload.recentActual.length - 1] || 0;
  const futurePeak = payload.futurePredicted.length
    ? Math.max(...payload.futurePredicted)
    : payload.peakValue;
  const growth = actualTail > 0 ? ((futurePeak - actualTail) / actualTail) * 100 : 0;

  return {
    summary: `${payload.topic} 预计在 ${payload.peakTime} 附近达到需求峰值（约 ${futurePeak.toLocaleString()}），当前模型置信度 ${payload.confidence.toFixed(1)}%。`,
    trendSignals: [
      `预测峰值较当前最近实况提升约 ${growth.toFixed(1)}%。`,
      `未来阶段需求曲线总体呈${growth >= 0 ? '上行' : '回落'}趋势，需结合城市与行业分层验证。`,
      '招聘窗口有望提前 2-4 周启动，建议同步准备候选人池。'
    ],
    riskPoints: [
      payload.confidence < 85
        ? '模型置信度偏低，建议补充最近 2 周数据后再确认资源投入。'
        : '模型稳定性较高，但仍需警惕突发政策与行业波动造成偏差。',
      '若异常薪资样本占比上升，预测结果可能出现高估风险。'
    ],
    actions: [
      '提前规划目标岗位投放节奏，按周滚动复盘需求变化。',
      '补充高频技能关键词与人才画像标签，提高筛选效率。',
      '对高峰期岗位预留面试官与预算，降低招聘延迟。'
    ],
    generatedAt: new Date().toISOString(),
    model: SILICONFLOW_MODEL
  };
};

const normalizeDataCleaningInsight = (
  payload: unknown,
  fallback: DataCleaningAiInsight
): DataCleaningAiInsight => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const scoreRaw = typeof record.score === 'number' ? record.score : Number(record.score);
  const score = Number.isFinite(scoreRaw) ? clampScore(scoreRaw) : fallback.score;
  const summary =
    typeof record.summary === 'string' && record.summary.trim()
      ? record.summary.trim()
      : fallback.summary;

  return {
    score,
    summary,
    risks: ensureStringArray(record.risks, fallback.risks),
    suggestions: ensureStringArray(record.suggestions, fallback.suggestions),
    generatedAt: new Date().toISOString(),
    model: typeof record.model === 'string' && record.model.trim() ? record.model : SILICONFLOW_MODEL
  };
};

const normalizeReportNarrative = (payload: unknown, fallback: ReportAiNarrative): ReportAiNarrative => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const summary =
    typeof record.summary === 'string' && record.summary.trim()
      ? record.summary.trim()
      : fallback.summary;

  return {
    summary,
    highlights: ensureStringArray(record.highlights, fallback.highlights),
    actions: ensureStringArray(record.actions, fallback.actions),
    generatedAt: new Date().toISOString(),
    model: typeof record.model === 'string' && record.model.trim() ? record.model : SILICONFLOW_MODEL
  };
};

const normalizeComparisonInsight = (
  payload: unknown,
  fallback: ComparisonAiInsight
): ComparisonAiInsight => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  return {
    summary:
      typeof record.summary === 'string' && record.summary.trim()
        ? record.summary.trim()
        : fallback.summary,
    advantagesA: ensureStringArray(record.advantagesA, fallback.advantagesA),
    advantagesB: ensureStringArray(record.advantagesB, fallback.advantagesB),
    suggestions: ensureStringArray(record.suggestions, fallback.suggestions),
    generatedAt: new Date().toISOString(),
    model: typeof record.model === 'string' && record.model.trim() ? record.model : SILICONFLOW_MODEL
  };
};

const normalizeForecastInsight = (
  payload: unknown,
  fallback: ForecastAiInsight
): ForecastAiInsight => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  return {
    summary:
      typeof record.summary === 'string' && record.summary.trim()
        ? record.summary.trim()
        : fallback.summary,
    trendSignals: ensureStringArray(record.trendSignals, fallback.trendSignals),
    riskPoints: ensureStringArray(record.riskPoints, fallback.riskPoints),
    actions: ensureStringArray(record.actions, fallback.actions),
    generatedAt: new Date().toISOString(),
    model: typeof record.model === 'string' && record.model.trim() ? record.model : SILICONFLOW_MODEL
  };
};

const requestSiliconFlowJson = async (prompt: string): Promise<unknown> => {
  if (!SILICONFLOW_API_KEY) {
    throw new ServiceError('未配置 SiliconFlow API Key，请检查环境变量', 'SILICONFLOW_KEY_MISSING', false);
  }

  const response = await fetch(`${SILICONFLOW_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SILICONFLOW_API_KEY}`
    },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
      temperature: 0.2,
      max_tokens: 1200,
      stream: false,
      messages: [
        {
          role: 'system',
          content: '你是招聘数据智能分析专家，必须严格输出 JSON，不允许输出额外解释。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const retryable = response.status >= 500 || response.status === 429 || response.status === 408;
    throw new ServiceError(
      `SiliconFlow 请求失败(${response.status}) ${errorText.slice(0, 120)}`,
      'SILICONFLOW_REQUEST_FAILED',
      retryable
    );
  }

  const result = (await response.json()) as SiliconFlowChatResponse;
  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ServiceError('SiliconFlow 未返回有效内容', 'SILICONFLOW_EMPTY_CONTENT', false);
  }

  return extractJsonPayload(content);
};

export const aiInsightService = {
  generateDataCleaningInsight: async (payload: DataCleaningPayload): Promise<DataCleaningAiInsight> => {
    const fallback = buildDataCleaningFallback(payload);
    const response = await requestWithMock<DataCleaningAiInsight>({
      endpoint: '/api/recruitment/ai/data-cleaning-insight',
      method: 'POST',
      useMock: !ENABLE_REAL_AI,
      retries: 1,
      mockHandler: async () => {
        await delay(620);
        return fallback;
      },
      realHandler: async () => {
        const prompt = `
请根据以下招聘数据清洗指标生成结构化诊断结论，只输出 JSON：
${JSON.stringify(payload, null, 2)}

JSON 字段必须包含：score(0-100), summary, risks(string[]), suggestions(string[]), model。
要求：语言简洁、可执行、面向数据治理场景。
`;
        const parsed = await requestSiliconFlowJson(prompt);
        return normalizeDataCleaningInsight(parsed, fallback);
      }
    });
    return unwrapResponse(response);
  },

  generateReportNarrative: async (report: ReportItem): Promise<ReportAiNarrative> => {
    const fallback = buildReportFallback(report);
    const response = await requestWithMock<ReportAiNarrative>({
      endpoint: '/api/recruitment/ai/report-narrative',
      method: 'POST',
      useMock: !ENABLE_REAL_AI,
      retries: 1,
      mockHandler: async () => {
        await delay(680);
        return fallback;
      },
      realHandler: async () => {
        const prompt = `
请根据以下招聘周报/月报摘要生成管理层解读，只输出 JSON：
${JSON.stringify(report.summary || {}, null, 2)}

JSON 字段必须包含：summary, highlights(string[]), actions(string[]), model。
要求：每段简短，强调结论、异常点、行动建议。
`;
        const parsed = await requestSiliconFlowJson(prompt);
        return normalizeReportNarrative(parsed, fallback);
      }
    });
    return unwrapResponse(response);
  },

  generateComparisonInsight: async (payload: ComparisonInsightPayload): Promise<ComparisonAiInsight> => {
    const fallback = buildComparisonFallback(payload);
    const response = await requestWithMock<ComparisonAiInsight>({
      endpoint: '/api/recruitment/ai/job-compare-insight',
      method: 'POST',
      useMock: !ENABLE_REAL_AI,
      retries: 1,
      mockHandler: async () => {
        await delay(620);
        return fallback;
      },
      realHandler: async () => {
        const prompt = `
请根据以下岗位对比数据生成结构化 AI 对比结论，只输出 JSON：
${JSON.stringify(payload, null, 2)}

JSON 字段必须包含：summary, advantagesA(string[]), advantagesB(string[]), suggestions(string[]), model。
要求：内容简洁、面向求职决策、语言为简体中文。
`;
        const parsed = await requestSiliconFlowJson(prompt);
        return normalizeComparisonInsight(parsed, fallback);
      }
    });
    return unwrapResponse(response);
  },

  generateForecastInsight: async (payload: ForecastInsightPayload): Promise<ForecastAiInsight> => {
    const fallback = buildForecastFallback(payload);
    const response = await requestWithMock<ForecastAiInsight>({
      endpoint: '/api/recruitment/ai/demand-forecast-insight',
      method: 'POST',
      useMock: !ENABLE_REAL_AI,
      retries: 1,
      mockHandler: async () => {
        await delay(640);
        return fallback;
      },
      realHandler: async () => {
        const prompt = `
请根据以下岗位需求预测数据生成结构化 AI 预测解读，只输出 JSON：
${JSON.stringify(payload, null, 2)}

JSON 字段必须包含：summary, trendSignals(string[]), riskPoints(string[]), actions(string[]), model。
要求：突出趋势、风险与执行建议，语言简洁、可用于管理汇报。
`;
        const parsed = await requestSiliconFlowJson(prompt);
        return normalizeForecastInsight(parsed, fallback);
      }
    });
    return unwrapResponse(response);
  }
};
