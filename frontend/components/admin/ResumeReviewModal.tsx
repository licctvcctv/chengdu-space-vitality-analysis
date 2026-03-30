import React, { useMemo } from 'react';
import { AlertTriangle, Brain, CheckCircle2, FileText, Loader2, Sparkles, Target, X } from 'lucide-react';
import { ResumeRewriteReview } from '../../types';

export interface ResumePreviewFileMeta {
  name: string;
  source: 'txt' | 'pdf' | 'docx';
  objectUrl: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resumeText: string;
  fileMeta: ResumePreviewFileMeta | null;
  review: ResumeRewriteReview | null;
  loading: boolean;
  onRunReview: () => void;
}

interface TextSegment {
  text: string;
  highlighted: boolean;
}

const buildHighlightedSegments = (text: string, snippets: string[]): TextSegment[] => {
  const cleanedText = text || '';
  const tokens = Array.from(
    new Set(
      snippets
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  )
    .sort((a, b) => b.length - a.length)
    .slice(0, 12);

  if (!cleanedText || tokens.length === 0) {
    return [{ text: cleanedText, highlighted: false }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  while (cursor < cleanedText.length) {
    let selectedIndex = -1;
    let selectedToken = '';

    for (const token of tokens) {
      const idx = cleanedText.indexOf(token, cursor);
      if (idx === -1) continue;
      if (selectedIndex === -1 || idx < selectedIndex || (idx === selectedIndex && token.length > selectedToken.length)) {
        selectedIndex = idx;
        selectedToken = token;
      }
    }

    if (selectedIndex === -1) {
      segments.push({ text: cleanedText.slice(cursor), highlighted: false });
      break;
    }

    if (selectedIndex > cursor) {
      segments.push({ text: cleanedText.slice(cursor, selectedIndex), highlighted: false });
    }

    segments.push({ text: selectedToken, highlighted: true });
    cursor = selectedIndex + selectedToken.length;
  }

  return segments;
};

const levelClassMap: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-blue-50 border-blue-200 text-blue-700'
};

const ResumeReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  resumeText,
  fileMeta,
  review,
  loading,
  onRunReview
}) => {
  const highlightedSegments = useMemo(
    () => buildHighlightedSegments(resumeText, review?.issues.map((item) => item.excerpt) || []),
    [resumeText, review]
  );

  if (!isOpen) return null;
  const showPdfPreview = fileMeta?.source === 'pdf';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-7xl h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-slate-800">简历预览与 AI 质检改写</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {fileMeta ? `${fileMeta.name} · ${fileMeta.source.toUpperCase()} 预览` : '当前内容来自文本编辑区'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="关闭"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-0">
          <div className="min-h-0 border-r border-slate-200 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              原始简历预览（支持 PDF/TXT/DOCX；圈出问题基于文本解析）
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {showPdfPreview && fileMeta?.objectUrl ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                  <iframe
                    src={fileMeta.objectUrl}
                    title="resume-file-preview"
                    className="w-full h-[300px] border-0"
                  />
                </div>
              ) : fileMeta?.source === 'docx' ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  DOCX 在浏览器中的原生预览兼容性有限，已展示文本解析内容用于圈出问题。
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="px-3 py-2 border-b border-slate-100 text-xs text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  文本问题定位（高亮片段即 AI 识别问题点）
                </div>
                <div className="p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                  {highlightedSegments.map((segment, index) =>
                    segment.highlighted ? (
                      <mark key={`hl-${index}`} className="bg-rose-200 text-rose-900 px-0.5 rounded">
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={`txt-${index}`}>{segment.text}</span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-blue-600" />
                AI 改写与问题说明
              </div>
              <button
                type="button"
                onClick={onRunReview}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {loading ? '分析中...' : review ? '重新生成改写建议' : '开始 AI 质检改写'}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="h-full min-h-[220px] rounded-xl border border-dashed border-blue-200 bg-blue-50 flex items-center justify-center text-sm text-blue-700 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在分析简历结构与内容，请稍候...
                </div>
              ) : review ? (
                <>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-blue-700">简历健康分</div>
                      <div className="text-3xl font-bold text-blue-700">{review.score}</div>
                    </div>
                    <p className="text-sm text-blue-900 mt-2 leading-relaxed">{review.summary}</p>
                    <div className="text-[11px] text-blue-700 mt-2">
                      模型：{review.model} · 生成时间：{new Date(review.generatedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="text-xs text-emerald-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      快速修正建议
                    </div>
                    <ul className="space-y-1 text-sm text-emerald-800">
                      {review.quickWins.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">问题清单（已在左侧文本圈出）</div>
                    {review.issues.map((issue) => (
                      <div key={issue.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm text-slate-800">{issue.title}</div>
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${levelClassMap[issue.level]}`}>
                            {issue.level === 'high' ? '高优先级' : issue.level === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">问题片段：{issue.excerpt}</div>
                        <div className="text-xs text-slate-600">问题说明：{issue.problem}</div>
                        <div className="text-xs text-slate-700">改进建议：{issue.suggestion}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                    <div className="text-xs text-violet-700 mb-2">AI 改写示例（可直接参考）</div>
                    <pre className="whitespace-pre-wrap text-sm text-violet-900 leading-relaxed">{review.revisedResume}</pre>
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[220px] rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-500">
                  点击“开始 AI 质检改写”后，将展示问题定位、改写建议与优化版示例。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeReviewModal;
