import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

interface ExtractResumeTextResult {
  text: string;
  source: 'txt' | 'pdf' | 'docx';
  warning?: string;
}

const MAX_FILE_SIZE_MB = 12;
const MAX_PDF_PAGES = 12;

const normalizeText = (rawText: string): string =>
  rawText
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const assertFileSize = (file: File) => {
  const limit = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > limit) {
    throw new Error(`文件过大（>${MAX_FILE_SIZE_MB}MB），请压缩后重试`);
  }
};

const parseDocxText = async (file: File): Promise<ExtractResumeTextResult> => {
  const mammothModule = (await import('mammoth/mammoth.browser')) as {
    extractRawText?: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: Array<{ message?: string }> }>;
    default?: {
      extractRawText?: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: Array<{ message?: string }> }>;
    };
  };

  const extractRawText = mammothModule.extractRawText || mammothModule.default?.extractRawText;
  if (!extractRawText) {
    throw new Error('DOCX 解析器加载失败，请稍后重试');
  }

  const result = await extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return {
    source: 'docx',
    text: normalizeText(result.value || ''),
    warning:
      result.messages.length > 0
        ? '已解析 Word 内容，部分格式（表格/图片）可能被忽略'
        : undefined
  };
};

const parsePdfText = async (file: File): Promise<ExtractResumeTextResult> => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

  const uint8 = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data: uint8 });
  const pdf = await loadingTask.promise;

  const pageLimit = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const row = (content.items as Array<{ str?: string }>)
      .map((item) => (typeof item.str === 'string' ? item.str : ''))
      .join(' ')
      .trim();
    if (row) {
      pageTexts.push(row);
    }
  }

  const warningList: string[] = [];
  if (pdf.numPages > MAX_PDF_PAGES) {
    warningList.push(`仅解析前 ${MAX_PDF_PAGES} 页`);
  }
  if (pageTexts.length === 0) {
    warningList.push('未检测到文本层，扫描版 PDF 建议转文本后上传');
  }

  await loadingTask.destroy();

  return {
    source: 'pdf',
    text: normalizeText(pageTexts.join('\n\n')),
    warning: warningList.length > 0 ? warningList.join('；') : undefined
  };
};

const parsePlainText = async (file: File): Promise<ExtractResumeTextResult> => ({
  source: 'txt',
  text: normalizeText(await file.text())
});

const getExtension = (fileName: string): string => {
  const index = fileName.lastIndexOf('.');
  if (index < 0) return '';
  return fileName.slice(index + 1).toLowerCase();
};

export const extractResumeTextFromFile = async (file: File): Promise<ExtractResumeTextResult> => {
  assertFileSize(file);

  const ext = getExtension(file.name);

  if (['txt', 'md', 'text', 'rtf'].includes(ext)) {
    return parsePlainText(file);
  }

  if (ext === 'docx') {
    return parseDocxText(file);
  }

  if (ext === 'pdf') {
    return parsePdfText(file);
  }

  if (ext === 'doc') {
    throw new Error('暂不支持旧版 .doc，请另存为 .docx 或导出为 PDF 后重试');
  }

  const fallback = await parsePlainText(file);
  return {
    ...fallback,
    warning: '文件类型未识别，已按纯文本解析，建议使用 TXT/PDF/DOCX'
  };
};

export const formatExtractSource = (source: ExtractResumeTextResult['source']): string => {
  if (source === 'pdf') return 'PDF';
  if (source === 'docx') return 'Word';
  return '文本';
};
