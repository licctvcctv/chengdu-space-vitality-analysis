import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  FileText,
  Lightbulb,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Upload
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { MOCK_CRAWLED_JOBS, type CrawledJobRecord } from '../mock/crawledJobsMock';
import { resumeService } from '../api/resumeService';
import { DeepSeekAdvice, ResumeJobMatchResult, ResumeProfile, ResumeRewriteReview } from '../types';
import { resumeStorage } from '../utils/resumeStorage';
import { extractResumeTextFromFile, formatExtractSource } from '../utils/fileTextExtractor';
import ResumeReviewModal, { type ResumePreviewFileMeta } from '../components/admin/ResumeReviewModal';

interface JobRecommendation extends CrawledJobRecord {
  requiredSkills: string[];
  matchedSkills: string[];
  fitScore: number;
}

interface JobAiScore {
  overall: number;
  skillScore: number;
  demandScore: number;
  salaryScore: number;
  stabilityScore: number;
  summary: string;
}

const priorityClassMap: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-blue-50 text-blue-600 border-blue-200'
};

const normalizeSkill = (skill: string): string => skill.trim().toLowerCase();
const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const buildJobAiScore = (job: JobRecommendation): JobAiScore => {
  const skillScore = job.requiredSkills.length
    ? clampScore((job.matchedSkills.length / job.requiredSkills.length) * 100)
    : 0;
  const demandScore = clampScore(((job.demand - 1500) / 17500) * 100);
  const salaryMid = (job.salaryMin + job.salaryMax) / 2;
  const salaryScore = clampScore(((salaryMid - 10) / 55) * 100);
  const salaryGap = job.salaryMax - job.salaryMin;
  const stabilityPenalty = job.note ? 14 : 0;
  const stabilityScore = clampScore(100 - salaryGap * 2 - stabilityPenalty);
  const overall = clampScore(skillScore * 0.45 + demandScore * 0.25 + salaryScore * 0.2 + stabilityScore * 0.1);

  const summary =
    overall >= 80
      ? '岗位匹配度较高，可直接投递并针对缺口技能做小幅补强。'
      : overall >= 65
        ? '岗位匹配度中上，建议优先补齐 1-2 项核心技能后投递。'
        : '岗位方向可尝试，但建议先补齐关键技能再进入面试阶段。';

  return {
    overall,
    skillScore,
    demandScore,
    salaryScore,
    stabilityScore,
    summary
  };
};

const ResumeAnalysis: React.FC = () => {
  const { message } = useUI();

  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<JobRecommendation[]>([]);
  const [matchResult, setMatchResult] = useState<ResumeJobMatchResult | null>(null);
  const [deepSeekAdvice, setDeepSeekAdvice] = useState<DeepSeekAdvice | null>(null);
  const [activeJob, setActiveJob] = useState<JobRecommendation | null>(null);
  const [previewFileMeta, setPreviewFileMeta] = useState<ResumePreviewFileMeta | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [resumeRewriteLoading, setResumeRewriteLoading] = useState(false);
  const [resumeRewriteReview, setResumeRewriteReview] = useState<ResumeRewriteReview | null>(null);

  const useAiParse =
    Boolean(import.meta.env.VITE_SILICONFLOW_API_KEY) &&
    (import.meta.env.VITE_USE_SILICONFLOW === 'true' || import.meta.env.VITE_USE_MOCK === 'false');

  const primaryRecommendation = recommendedJobs[0] ?? null;
  const activeRecommendation = activeJob ?? primaryRecommendation;

  const requiredSkills = useMemo(() => activeRecommendation?.requiredSkills || [], [activeRecommendation]);
  const activeJobScore = useMemo(
    () => (activeRecommendation ? buildJobAiScore(activeRecommendation) : null),
    [activeRecommendation]
  );
  const activeMatchResult = useMemo<ResumeJobMatchResult | null>(() => {
    if (!activeRecommendation) return null;
    if (matchResult && matchResult.jobTitle === activeRecommendation.jobTitle) return matchResult;

    const required = activeRecommendation.requiredSkills;
    const matched = activeRecommendation.matchedSkills;
    const missing = required.filter((skill) => !matched.includes(skill));
    const matchScore = required.length > 0 ? clampScore((matched.length / required.length) * 100) : 0;

    return {
      jobTitle: activeRecommendation.jobTitle,
      requiredSkills: required,
      matchedSkills: matched,
      missingSkills: missing,
      matchScore
    };
  }, [activeRecommendation, matchResult]);

  useEffect(
    () => () => {
      if (previewFileMeta?.objectUrl) {
        URL.revokeObjectURL(previewFileMeta.objectUrl);
      }
    },
    [previewFileMeta?.objectUrl]
  );

  const buildRecommendations = (profile: ResumeProfile): JobRecommendation[] => {
    const resumeSkillSet = new Set(profile.extractedSkills.map(normalizeSkill));

    const scored = MOCK_CRAWLED_JOBS.map((job) => {
      const required = resumeService.getRequiredSkillsByJob(job.jobTitle);
      const matched = required.filter((skill) => resumeSkillSet.has(normalizeSkill(skill)));
      const matchRate = required.length > 0 ? matched.length / required.length : 0;
      const demandBoost = Math.min(18, job.demand / 1200);
      const directionBoost = profile.targetJobs.some(
        (target) => target.includes(job.jobTitle) || job.jobTitle.includes(target)
      )
        ? 12
        : 0;
      const fitScore = Math.round(matchRate * 70 + demandBoost + directionBoost);

      return {
        ...job,
        requiredSkills: required,
        matchedSkills: matched,
        fitScore
      };
    });

    const dedup = new Map<string, JobRecommendation>();
    scored
      .sort((a, b) => {
        if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
        return b.demand - a.demand;
      })
      .forEach((item) => {
        if (!dedup.has(item.jobTitle)) {
          dedup.set(item.jobTitle, item);
        }
      });

    return Array.from(dedup.values()).slice(0, 5);
  };

  const resetResults = () => {
    setResumeProfile(null);
    setRecommendedJobs([]);
    setMatchResult(null);
    setDeepSeekAdvice(null);
    setActiveJob(null);
    setResumeRewriteReview(null);
  };

  const handleReadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const result = await extractResumeTextFromFile(file);
      if (!result.text.trim()) {
        message.warning('未读取到有效文本，请上传可复制文本的 PDF/DOCX 或直接粘贴简历');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setResumeText(result.text);
      resetResults();
      setPreviewFileMeta((prev) => {
        if (prev?.objectUrl) {
          URL.revokeObjectURL(prev.objectUrl);
        }
        return {
          name: file.name,
          source: result.source,
          objectUrl
        };
      });
      message.success(`${formatExtractSource(result.source)}简历内容已读取，点击下方按钮即可完成全流程 AI 分析`);
      if (result.warning) {
        message.info(result.warning);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '简历读取失败';
      message.error(errorMessage);
    }
  };

  const createMarketSignals = (jobTitle: string): string[] => [
    `${jobTitle} 在系统爬虫岗位池中保持高热度`,
    `岗位需求来自 ${MOCK_CRAWLED_JOBS.length} 条抓取数据`,
    `${jobTitle} 对工程化能力与业务理解要求提升`
  ];

  const runResumeRewriteReview = async () => {
    if (!resumeText.trim()) {
      message.warning('请先上传或粘贴简历文本');
      return;
    }

    setResumeRewriteLoading(true);
    try {
      const review = await resumeService.reviewAndRewriteResume(resumeText);
      setResumeRewriteReview(review);
      message.success('AI 简历质检与改写已完成');
    } catch (error) {
      message.error('AI 简历质检失败，请稍后重试');
    } finally {
      setResumeRewriteLoading(false);
    }
  };

  const handleOpenPreviewAndReview = () => {
    if (!resumeText.trim()) {
      message.warning('请先上传或粘贴简历文本');
      return;
    }

    setReviewModalOpen(true);
    if (!resumeRewriteReview && !resumeRewriteLoading) {
      void runResumeRewriteReview();
    }
  };

  const handleRunAll = async () => {
    if (!resumeText.trim()) {
      message.warning('请先上传或粘贴简历文本');
      return;
    }

    setIsRunning(true);
    setMatchResult(null);
    setDeepSeekAdvice(null);

    try {
      const profile = await resumeService.analyzeResumeText(resumeText);
      setResumeProfile(profile);
      resumeStorage.saveLatest(profile);

      const jobs = buildRecommendations(profile);
      setRecommendedJobs(jobs);

      if (!jobs.length) {
        message.warning('暂未生成岗位推荐，请调整简历内容后重试');
        return;
      }

      const topJob = jobs[0];
      setActiveJob(topJob);
      const match = await resumeService.matchResumeToJob(profile, topJob.jobTitle, topJob.requiredSkills);
      setMatchResult(match);

      const advice = await resumeService.generateDeepSeekAdvice({
        jobTitle: topJob.jobTitle,
        resumeSkills: profile.extractedSkills,
        missingSkills: match.missingSkills,
        marketSignals: createMarketSignals(topJob.jobTitle)
      });
      setDeepSeekAdvice(advice);

      message.success(`AI 分析完成：推荐岗位 ${topJob.jobTitle}，匹配度 ${match.matchScore}%`);
    } catch (error) {
      message.error('AI 分析失败，请稍后重试');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI 简历分析与岗位推荐</h2>
            <p className="text-xs text-slate-500 mt-1">
              单按钮全流程：上传简历 - AI 解析 - 基于系统爬虫岗位数据推荐 - 输出匹配度与 DeepSeek 建议。
            </p>
            <p className="text-xs mt-1 text-slate-500">
              当前解析模式：
              <span className={`ml-1 font-semibold ${useAiParse ? 'text-emerald-600' : 'text-amber-600'}`}>
                {useAiParse ? 'SiliconFlow AI 实时解析' : '本地智能解析（网络不可用时自动回退）'}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" /> 上传或粘贴简历
              </h3>
              <span className="text-xs text-slate-400">支持 TXT / PDF / DOCX</span>
            </div>

            <label className="relative border border-dashed border-slate-300 hover:border-blue-400 rounded-lg px-4 py-3 cursor-pointer text-sm text-slate-600 transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.text,.pdf,.docx,.doc"
                onChange={handleReadFile}
              />
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {fileName ? `已选择：${fileName}` : '点击选择简历文件'}
              </div>
            </label>

            <textarea
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value);
                resetResults();
              }}
              rows={13}
              placeholder="可直接粘贴简历文本，例如：技术栈、项目经历、教育背景"
              className="w-full border border-slate-300 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 resize-none"
            />

            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {isRunning ? 'AI 分析中...' : '一键 AI 解析并推荐岗位'}
            </button>

            <button
              onClick={handleOpenPreviewAndReview}
              disabled={resumeRewriteLoading}
              className="w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {resumeRewriteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {resumeRewriteLoading ? 'AI 质检中...' : '预览简历并 AI 圈出问题'}
            </button>
            <p className="text-xs text-slate-500 leading-relaxed">
              点击后将弹出预览窗，支持 PDF/TXT/DOCX 预览，并自动生成简历问题定位与改写建议。
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">简历画像（AI 解析）</h3>
            {resumeProfile ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">经验年限</div>
                    <div className="font-semibold text-slate-700">{resumeProfile.experienceYears} 年</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">最高学历</div>
                    <div className="font-semibold text-slate-700">{resumeProfile.education}</div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-500">识别方向</div>
                    <div className="font-semibold text-slate-700">{resumeProfile.targetJobs.join(' / ')}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-2">识别技能</div>
                  <div className="flex flex-wrap gap-2">
                    {resumeProfile.extractedSkills.map((skill) => (
                      <span key={skill} className="px-2 py-1 text-xs rounded border border-blue-200 bg-blue-50 text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                尚未执行分析，点击上方按钮后自动生成简历画像。
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> 简历质检与改写
              </h3>
              {resumeRewriteReview && <span className="text-xs text-blue-700">健康分 {resumeRewriteReview.score}</span>}
            </div>

            {resumeRewriteReview ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900 leading-relaxed">
                  {resumeRewriteReview.summary}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-red-700">
                    高优先级问题：{resumeRewriteReview.issues.filter((item) => item.level === 'high').length}
                  </div>
                  <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-700">
                    中优先级问题：{resumeRewriteReview.issues.filter((item) => item.level === 'medium').length}
                  </div>
                  <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-700">
                    低优先级问题：{resumeRewriteReview.issues.filter((item) => item.level === 'low').length}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 transition-colors"
                >
                  查看问题定位与改写详情
                </button>
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                预览简历后即可生成 AI 质检结果，系统会圈出问题片段并给出改写稿。
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" /> 系统爬虫岗位推荐（Top 5）
            </h3>
            <p className="text-xs text-slate-500 mb-3">推荐数据来源：系统爬取岗位池（共 {MOCK_CRAWLED_JOBS.length} 条）</p>
            {recommendedJobs.length > 0 ? (
              <div className="space-y-2">
                {recommendedJobs.map((job, index) => (
                  <button
                    key={`${job.id}-${job.jobTitle}`}
                    type="button"
                    onClick={() => setActiveJob(job)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                      (activeRecommendation?.id ?? primaryRecommendation?.id) === job.id
                        ? 'border-blue-300 bg-blue-50/80 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-700">
                        {index + 1}. {job.jobTitle}
                      </div>
                      <div className="text-xs text-blue-700">推荐分 {job.fitScore}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {job.company} · {job.city} · {job.salaryMin}-{job.salaryMax}K · 需求热度 {job.demand}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      技能命中：{job.matchedSkills.length}/{job.requiredSkills.length}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                执行分析后，这里会展示基于爬虫岗位数据的推荐结果。
              </div>
            )}

            {activeRecommendation && activeJobScore && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">岗位详情 AI 评分卡</div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{activeRecommendation.jobTitle}</div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {activeRecommendation.company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {activeRecommendation.city}
                      </span>
                      <span>{activeRecommendation.salaryMin}-{activeRecommendation.salaryMax}K</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-700">综合评分</div>
                    <div className="text-3xl font-bold text-blue-700">{activeJobScore.overall}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white/80 border border-blue-100 rounded-lg px-3 py-2">
                  {activeJobScore.summary}
                </p>

                <div className="space-y-2">
                  {[
                    { label: '技能匹配', value: activeJobScore.skillScore },
                    { label: '市场热度', value: activeJobScore.demandScore },
                    { label: '薪资竞争力', value: activeJobScore.salaryScore },
                    { label: '岗位稳定性', value: activeJobScore.stabilityScore }
                  ].map((item) => (
                    <div key={item.label} className="grid grid-cols-[64px_1fr_36px] items-center gap-2 text-xs">
                      <span className="text-slate-500">{item.label}</span>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.value}%` }} />
                      </div>
                      <span className="font-semibold text-slate-700 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400">
                  最近采集时间：{activeRecommendation.crawlTime}
                  {activeRecommendation.note ? ` · 风险备注：${activeRecommendation.note}` : ''}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-orange-500" /> 推荐岗位技能需求与诊断
            </h3>

            {activeRecommendation && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                当前分析岗位：
                <span className="font-semibold text-slate-700 ml-1">{activeRecommendation.jobTitle}</span>
              </div>
            )}

            {requiredSkills.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">岗位技能需求</div>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 text-xs rounded border border-slate-200 bg-slate-50 text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeMatchResult ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700 mb-1">岗位匹配度</div>
                  <div className="text-2xl font-bold text-emerald-700">{activeMatchResult.matchScore}%</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="text-xs text-blue-700 mb-1">已命中技能</div>
                    <div className="text-sm text-blue-700 leading-relaxed">{activeMatchResult.matchedSkills.join('、') || '暂无'}</div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-xs text-amber-700 mb-1">待补齐技能</div>
                    <div className="text-sm text-amber-700 leading-relaxed">{activeMatchResult.missingSkills.join('、') || '暂无'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                执行分析后会自动生成匹配诊断，无需额外按钮。
              </div>
            )}

            {deepSeekAdvice && (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">模型：{deepSeekAdvice.model}</div>
                  <span className="text-[11px] text-blue-700 inline-flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    深度建议基于主推荐岗位输出
                  </span>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800 leading-relaxed">
                  {deepSeekAdvice.summary}
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-2">技能缺口优先级</div>
                  <div className="space-y-2">
                    {deepSeekAdvice.gapSkills.map((item) => (
                      <div key={item.skill} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-slate-700">{item.skill}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${priorityClassMap[item.priority]}`}>
                            {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">{item.reason}</div>
                        <div className="text-xs text-slate-700 mt-1">建议动作：{item.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/80">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 简历优化要点
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {deepSeekAdvice.resumeOptimizations.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/80">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> 学习路径
                    </div>
                    <ul className="space-y-2 text-sm text-slate-700">
                      {deepSeekAdvice.learningPath.map((item) => (
                        <li key={item.phase}>
                          <span className="font-medium text-slate-800">{item.phase}</span>：聚焦 {item.focus}，目标 {item.target}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {activeRecommendation && activeRecommendation.note && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    当前岗位存在数据清洗提示：{activeRecommendation.note}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ResumeReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        resumeText={resumeText}
        fileMeta={previewFileMeta}
        review={resumeRewriteReview}
        loading={resumeRewriteLoading}
        onRunReview={runResumeRewriteReview}
      />
    </div>
  );
};

export default ResumeAnalysis;
