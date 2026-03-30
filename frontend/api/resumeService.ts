import { delay } from '../utils/delay';
import {
  DeepSeekAdvice,
  DeepSeekAdviceRequest,
  ResumeJobMatchResult,
  ResumeProfile,
  ResumeReviewIssue,
  ResumeRewriteReview
} from '../types';
import {
  FALLBACK_REQUIRED_SKILLS,
  JOB_SKILL_REQUIREMENT_MAP,
  MARKET_HOT_SKILLS,
  MOCK_RESUME_TEXT
} from '../mock/resumeMock';
import { requestWithMock, ServiceError, unwrapResponse } from './apiClient';

const SILICONFLOW_API_BASE_URL = (import.meta.env.VITE_SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/$/, '');
const SILICONFLOW_API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY || '';
const SILICONFLOW_MODEL =
  import.meta.env.VITE_SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B';
const ENABLE_REAL_DEEPSEEK =
  Boolean(SILICONFLOW_API_KEY) &&
  (import.meta.env.VITE_USE_SILICONFLOW === 'true' || import.meta.env.VITE_USE_MOCK === 'false');

const SKILL_DICTIONARY = [
  'TypeScript',
  'JavaScript',
  'React',
  'Vue',
  'Node.js',
  'Java',
  'Spring Boot',
  'MySQL',
  'Redis',
  'Python',
  'Spark',
  'Flink',
  'Kafka',
  'Docker',
  'Kubernetes',
  'SQL',
  '可视化',
  '机器学习',
  'LLM应用',
  'Prompt工程',
  '微服务',
  '工程化',
  '性能优化',
  'MLOps',
  '统计分析',
  '自动化测试',
  'CI/CD',
  '数据建模',
  'RAG',
  '沟通协同',
  '项目管理',
  '安全运营',
  '应急响应'
];

const normalizeSkill = (skill: string): string => skill.trim().toLowerCase();
const normalizeTextForPrompt = (text: string): string => text.replace(/\s+/g, ' ').trim();

const extractSkills = (rawText: string): string[] => {
  if (!rawText.trim()) {
    return [];
  }

  const lowerText = rawText.toLowerCase();
  const hitSkills = SKILL_DICTIONARY.filter((skill) => lowerText.includes(skill.toLowerCase()));

  if (hitSkills.length > 0) {
    return Array.from(new Set(hitSkills));
  }

  return ['沟通协同', '问题定位'];
};

const inferExperienceYears = (rawText: string): number => {
  const yearMatch = rawText.match(/(\d{1,2})\s*年/);
  if (yearMatch?.[1]) {
    return Number(yearMatch[1]);
  }
  if (rawText.includes('应届') || rawText.includes('实习')) {
    return 0;
  }
  return 2;
};

const inferEducation = (rawText: string): string => {
  if (rawText.includes('博士')) return '博士';
  if (rawText.includes('硕士')) return '硕士';
  if (rawText.includes('大专')) return '大专';
  return '本科';
};

const inferTargetJobs = (skills: string[]): string[] => {
  const rules: Array<{ match: (list: string[]) => boolean; jobs: string[] }> = [
    {
      match: (list) => list.some((item) => ['React', 'Vue', 'TypeScript', 'JavaScript'].includes(item)),
      jobs: ['前端开发工程师']
    },
    {
      match: (list) => list.some((item) => ['Java', 'Spring Boot', 'MySQL'].includes(item)),
      jobs: ['Java后端开发']
    },
    {
      match: (list) => list.some((item) => ['LLM应用', 'Prompt工程', '机器学习', 'Python'].includes(item)),
      jobs: ['算法工程师(AIGC)', '机器学习平台工程师']
    },
    {
      match: (list) => list.some((item) => ['Spark', 'Flink', 'Kafka', '数据建模'].includes(item)),
      jobs: ['数据平台架构师']
    }
  ];

  const result = rules.flatMap((rule) => (rule.match(skills) ? rule.jobs : []));
  return result.length > 0 ? Array.from(new Set(result)) : ['前端开发工程师'];
};

const ensureScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const createResumeProfile = (text: string): ResumeProfile => {
  const cleanedText = text.trim() || MOCK_RESUME_TEXT;
  const skills = extractSkills(cleanedText);
  return {
    id: `resume-${Date.now()}`,
    rawText: cleanedText,
    extractedSkills: skills,
    experienceYears: inferExperienceYears(cleanedText),
    education: inferEducation(cleanedText),
    targetJobs: inferTargetJobs(skills),
    updatedAt: new Date().toISOString()
  };
};

const normalizeExperienceYears = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(20, Math.round(value)));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(20, Math.round(parsed)));
    }
  }
  return fallback;
};

const normalizeEducationValue = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return fallback;
  }

  if (cleaned.includes('博士')) return '博士';
  if (cleaned.includes('硕士')) return '硕士';
  if (cleaned.includes('大专')) return '大专';
  if (cleaned.includes('本科')) return '本科';
  return fallback;
};

const normalizeTargetJobsBySystem = (value: unknown, fallbackSkills: string[], fallbackJobs: string[]): string[] => {
  const allowedJobs = Object.keys(JOB_SKILL_REQUIREMENT_MAP);
  const rawJobs = ensureStringArray(value, []);

  const normalized = rawJobs
    .map((job) => {
      const exactMatch = allowedJobs.find((allowed) => allowed === job);
      if (exactMatch) return exactMatch;
      const includeMatch = allowedJobs.find((allowed) => allowed.includes(job) || job.includes(allowed));
      return includeMatch || '';
    })
    .filter((job) => job.length > 0);

  if (normalized.length > 0) {
    return Array.from(new Set(normalized)).slice(0, 4);
  }

  const inferred = inferTargetJobs(fallbackSkills);
  if (inferred.length > 0) {
    return inferred;
  }
  return fallbackJobs;
};

const normalizeResumeProfileByAI = (payload: unknown, fallbackProfile: ResumeProfile): ResumeProfile => {
  if (!payload || typeof payload !== 'object') {
    return fallbackProfile;
  }

  const record = payload as Record<string, unknown>;
  const parsedSkills = ensureStringArray(record.extractedSkills, fallbackProfile.extractedSkills);
  const uniqueSkills = Array.from(new Set(parsedSkills));

  return {
    ...fallbackProfile,
    extractedSkills: uniqueSkills.length > 0 ? uniqueSkills : fallbackProfile.extractedSkills,
    experienceYears: normalizeExperienceYears(record.experienceYears, fallbackProfile.experienceYears),
    education: normalizeEducationValue(record.education, fallbackProfile.education),
    targetJobs: normalizeTargetJobsBySystem(record.targetJobs, uniqueSkills, fallbackProfile.targetJobs),
    updatedAt: new Date().toISOString()
  };
};

const getRequiredSkillsByJob = (jobTitle: string): string[] => {
  const keywordEntry = Object.entries(JOB_SKILL_REQUIREMENT_MAP).find(([key]) => jobTitle.includes(key));
  if (keywordEntry) {
    return keywordEntry[1];
  }
  return FALLBACK_REQUIRED_SKILLS;
};

const buildMatchResult = (
  resume: ResumeProfile,
  jobTitle: string,
  requiredSkills: string[]
): ResumeJobMatchResult => {
  const resumeSkillSet = new Set(resume.extractedSkills.map(normalizeSkill));
  const uniqueRequiredSkills = Array.from(new Set(requiredSkills));

  const matchedSkills = uniqueRequiredSkills.filter((skill) => resumeSkillSet.has(normalizeSkill(skill)));
  const missingSkills = uniqueRequiredSkills.filter((skill) => !resumeSkillSet.has(normalizeSkill(skill)));

  const baseScore = uniqueRequiredSkills.length === 0 ? 0 : (matchedSkills.length / uniqueRequiredSkills.length) * 100;
  const bonus = resume.experienceYears >= 3 ? 8 : resume.experienceYears >= 1 ? 4 : 0;

  return {
    jobTitle,
    requiredSkills: uniqueRequiredSkills,
    matchedSkills,
    missingSkills,
    matchScore: ensureScore(baseScore + bonus)
  };
};

const buildDeepSeekAdvice = (request: DeepSeekAdviceRequest): DeepSeekAdvice => {
  const gapItems = request.missingSkills.map((skill, index) => ({
    skill,
    priority: index <= 1 ? 'high' : index <= 3 ? 'medium' : 'low',
    reason: `${skill} 在目标岗位 JD 中出现频次较高，且当前简历未体现项目经验。`,
    action: `补充 1 个与 ${skill} 相关的实战项目，并在简历中量化结果。`
  }));

  const hotButMissing = MARKET_HOT_SKILLS.filter(
    (skill) => !request.resumeSkills.map(normalizeSkill).includes(normalizeSkill(skill))
  ).slice(0, 2);

  const marketInsights =
    request.marketSignals.length > 0
      ? request.marketSignals.map((item) => `- ${item}`).join('\n')
      : '- 当前岗位需求对工程化与 AI 协同能力持续提升。';

  return {
    model: SILICONFLOW_MODEL,
    generatedAt: new Date().toISOString(),
    summary:
      gapItems.length === 0
        ? `简历与岗位 ${request.jobTitle} 技能匹配度较高，可重点优化项目成果与业务价值表达。`
        : `简历与岗位 ${request.jobTitle} 存在 ${gapItems.length} 个核心技能缺口，建议按照“高优先级技能 -> 项目实战 -> 简历表达”顺序补齐。`,
    strengths: request.resumeSkills.slice(0, 4),
    gapSkills: gapItems,
    resumeOptimizations: [
      '将“负责功能开发”改为“完成 X 功能并带来 Y 指标提升”的结果化表达。',
      '在最近两段项目经历中补充目标岗位相关关键词，避免 ATS 漏检。',
      '增加技术栈分层展示（核心技能 / 工具链 / 项目实践），提升可读性。'
    ],
    learningPath: [
      { phase: '第1周', focus: gapItems[0]?.skill || '工程化能力', target: '完成基础知识补齐并输出学习笔记' },
      { phase: '第2-3周', focus: gapItems[1]?.skill || '项目实战', target: '完成可演示项目并形成作品链接' },
      { phase: '第4周', focus: '简历优化与模拟面试', target: '形成一页式简历 + 2 轮面试问答清单' }
    ],
    marketTips: [
      ...hotButMissing.map((skill) => `建议补充市场高热技能：${skill}`),
      marketInsights
    ]
  };
};

const resolveExcerpt = (rawText: string, keywordPattern: RegExp): string => {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const matched = lines.find((line) => keywordPattern.test(line));
  if (matched) return matched.slice(0, 120);
  return lines[0]?.slice(0, 120) || rawText.slice(0, 120);
};

const buildResumeRewriteFallback = (rawText: string): ResumeRewriteReview => {
  const normalizedText = rawText.trim() || MOCK_RESUME_TEXT;
  const lines = normalizedText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const issues: ResumeReviewIssue[] = [];
  const addIssue = (
    level: ResumeReviewIssue['level'],
    title: string,
    excerpt: string,
    problem: string,
    suggestion: string
  ) => {
    issues.push({
      id: `issue-${issues.length + 1}`,
      level,
      title,
      excerpt,
      problem,
      suggestion
    });
  };

  const hasQuantifiedResult =
    /(\d+(\.\d+)?\s*%|提升|增长|降低|缩短|节省|万|k|K|ms|QPS|PV|UV|转化率|覆盖率)/.test(normalizedText);
  if (!hasQuantifiedResult) {
    addIssue(
      'high',
      '项目成果缺少量化结果',
      resolveExcerpt(normalizedText, /(负责|参与|搭建|开发|优化|维护)/),
      '描述多为职责陈述，缺少可验证的业务结果与技术收益，难以体现真实贡献。',
      '每段项目补充 1-2 个数字化指标（如性能提升%、效率提升、成本下降、并发能力提升）。'
    );
  }

  const hasProjectSection = /(项目经历|项目经验|project|experience)/i.test(normalizedText);
  if (!hasProjectSection) {
    addIssue(
      'high',
      '结构不完整：缺少项目经历标题',
      resolveExcerpt(normalizedText, /(工作|实习|经历|公司|校园)/),
      '简历缺少明确的“项目经历”分节，招聘方很难快速定位你的技术落地能力。',
      '按“项目名称-技术栈-职责-结果”四段式补齐项目经历，并突出个人主导部分。'
    );
  }

  const hasSkillBlock = /(技能|技术栈|熟悉|掌握|skill|tech stack)/i.test(normalizedText);
  if (!hasSkillBlock) {
    addIssue(
      'medium',
      '技能展示分散',
      resolveExcerpt(normalizedText, /(react|vue|java|python|sql|docker|kubernetes|typescript)/i),
      '技术关键词分散在段落中，不利于 ATS 检索与招聘方快速匹配。',
      '新增“核心技能”分区，按语言/框架/中间件/工程化工具分组展示。'
    );
  }

  const hasOverLongSentence = lines.some((line) => line.length >= 80);
  if (hasOverLongSentence) {
    addIssue(
      'medium',
      '句子过长影响可读性',
      resolveExcerpt(normalizedText, /.{40,}/),
      '长句堆叠导致信息密度过高，重要结果不突出。',
      '将长句拆为短 bullet；每条围绕“动作 + 场景 + 结果”表达，单条建议 25-40 字。'
    );
  }

  if (issues.length === 0) {
    addIssue(
      'low',
      '可进一步优化关键词匹配',
      resolveExcerpt(normalizedText, /(前端|后端|算法|数据|工程师|平台)/),
      '整体质量较好，但岗位关键词覆盖仍可继续增强。',
      '根据目标岗位 JD 增补 3-5 个高频关键词，并映射到对应项目成果中。'
    );
  }

  const highCount = issues.filter((item) => item.level === 'high').length;
  const mediumCount = issues.filter((item) => item.level === 'medium').length;
  const lowCount = issues.filter((item) => item.level === 'low').length;
  const score = ensureScore(92 - highCount * 18 - mediumCount * 10 - lowCount * 4);

  const profile = createResumeProfile(normalizedText);
  const topDirection = profile.targetJobs[0] || '目标岗位';
  const skillLine = profile.extractedSkills.slice(0, 10).join(' / ') || '请补充核心技能';

  const revisedResume = [
    `[求职意向] ${topDirection}`,
    `[个人概述] ${Math.max(0, profile.experienceYears)}年相关经验，聚焦${topDirection}方向，具备从需求到交付的完整项目推进能力。`,
    `[核心技能] ${skillLine}`,
    '[项目经历]',
    '1) 项目A（请替换为真实项目名）',
    '- 技术栈：请填写与目标岗位相关的核心栈',
    '- 职责：在明确业务目标下负责核心模块设计与实现，推动跨角色协作',
    '- 成果：补充可量化结果（例如性能提升XX%，交付周期缩短XX%）',
    '2) 项目B（请替换为真实项目名）',
    '- 技术栈：请填写第二条差异化技术能力',
    '- 职责：负责关键链路优化与稳定性治理',
    '- 成果：补充成本、效率或用户指标提升的量化数据',
    '[教育经历]',
    `- ${profile.education}（请补充学校、专业、时间）`
  ].join('\n');

  const quickWins = issues
    .slice(0, 3)
    .map((item) => item.suggestion)
    .filter((item) => item.length > 0);

  return {
    model: SILICONFLOW_MODEL,
    generatedAt: new Date().toISOString(),
    score,
    summary:
      score >= 80
        ? '简历基础结构较好，重点补充量化结果与岗位关键词即可显著提升通过率。'
        : '简历仍有关键表达缺口，建议先按高优先级问题修正，再进行岗位投递。',
    quickWins: quickWins.length > 0 ? quickWins : ['补充关键项目的量化结果与岗位关键词。'],
    issues,
    revisedResume
  };
};

interface SiliconFlowChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const ensureStringArray = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const result = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
  return result.length > 0 ? result : fallback;
};

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

const normalizeDeepSeekAdvice = (
  payload: unknown,
  fallbackAdvice: DeepSeekAdvice
): DeepSeekAdvice => {
  if (!payload || typeof payload !== 'object') {
    return fallbackAdvice;
  }

  const record = payload as Record<string, unknown>;
  const parsedGapSkills = Array.isArray(record.gapSkills)
    ? record.gapSkills
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const entry = item as Record<string, unknown>;
          const priority = entry.priority;
          const normalizedPriority =
            priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'medium';
          return {
            skill: typeof entry.skill === 'string' ? entry.skill : '',
            priority: normalizedPriority,
            reason: typeof entry.reason === 'string' ? entry.reason : '',
            action: typeof entry.action === 'string' ? entry.action : ''
          };
        })
        .filter((item) => item && item.skill && item.reason && item.action)
    : fallbackAdvice.gapSkills;

  const summary =
    typeof record.summary === 'string' && record.summary.trim().length > 0
      ? record.summary.trim()
      : fallbackAdvice.summary;

  return {
    model: typeof record.model === 'string' && record.model.trim() ? record.model : SILICONFLOW_MODEL,
    generatedAt: new Date().toISOString(),
    summary,
    strengths: ensureStringArray(record.strengths, fallbackAdvice.strengths),
    gapSkills: parsedGapSkills.length > 0 ? parsedGapSkills : fallbackAdvice.gapSkills,
    resumeOptimizations: ensureStringArray(record.resumeOptimizations, fallbackAdvice.resumeOptimizations),
    learningPath: Array.isArray(record.learningPath)
      ? record.learningPath
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const entry = item as Record<string, unknown>;
            if (
              typeof entry.phase !== 'string' ||
              typeof entry.focus !== 'string' ||
              typeof entry.target !== 'string'
            ) {
              return null;
            }
            return {
              phase: entry.phase,
              focus: entry.focus,
              target: entry.target
            };
          })
          .filter((item) => item !== null)
      : fallbackAdvice.learningPath,
    marketTips: ensureStringArray(record.marketTips, fallbackAdvice.marketTips)
  };
};

const normalizeIssueLevel = (value: unknown): ResumeReviewIssue['level'] => {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'medium';
};

const normalizeResumeReviewIssues = (value: unknown, fallback: ResumeReviewIssue[]): ResumeReviewIssue[] => {
  if (!Array.isArray(value)) return fallback;

  const parsed = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const excerpt = typeof record.excerpt === 'string' ? record.excerpt.trim() : '';
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const problem = typeof record.problem === 'string' ? record.problem.trim() : '';
      const suggestion = typeof record.suggestion === 'string' ? record.suggestion.trim() : '';

      if (!excerpt || !title || !problem || !suggestion) {
        return null;
      }

      return {
        id: typeof record.id === 'string' && record.id.trim() ? record.id.trim() : `issue-${index + 1}`,
        level: normalizeIssueLevel(record.level),
        title,
        excerpt,
        problem,
        suggestion
      };
    })
    .filter((item): item is ResumeReviewIssue => item !== null);

  return parsed.length > 0 ? parsed : fallback;
};

const normalizeResumeRewriteReview = (
  payload: unknown,
  fallback: ResumeRewriteReview
): ResumeRewriteReview => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const rawScore = typeof record.score === 'number' ? record.score : Number(record.score);
  const score = Number.isFinite(rawScore) ? ensureScore(rawScore) : fallback.score;
  const summary =
    typeof record.summary === 'string' && record.summary.trim().length > 0
      ? record.summary.trim()
      : fallback.summary;
  const revisedResume =
    typeof record.revisedResume === 'string' && record.revisedResume.trim().length > 0
      ? record.revisedResume.trim()
      : fallback.revisedResume;

  return {
    model: typeof record.model === 'string' && record.model.trim().length > 0 ? record.model : SILICONFLOW_MODEL,
    generatedAt: new Date().toISOString(),
    score,
    summary,
    quickWins: ensureStringArray(record.quickWins, fallback.quickWins),
    issues: normalizeResumeReviewIssues(record.issues, fallback.issues),
    revisedResume
  };
};

const callSiliconFlowResumeRewrite = async (rawText: string): Promise<ResumeRewriteReview> => {
  if (!SILICONFLOW_API_KEY) {
    throw new ServiceError('未配置 SiliconFlow API Key，请检查环境变量', 'SILICONFLOW_KEY_MISSING', false);
  }

  const fallbackReview = buildResumeRewriteFallback(rawText);
  const prompt = `
请你扮演资深简历教练与技术面试官，对以下简历文本进行“问题定位 + 改写示例”。

简历文本：
${normalizeTextForPrompt(rawText).slice(0, 9000)}

输出要求：
1) 仅输出 JSON，不要 Markdown，不要额外解释。
2) 字段必须完整：model, score, summary, quickWins, issues, revisedResume。
3) score 为 0-100 的数字。
4) quickWins 为 3-5 条可执行建议（字符串数组）。
5) issues 为数组，每项包含：id, level(high/medium/low), title, excerpt, problem, suggestion。
6) excerpt 需尽量引用原文中的具体片段，用于页面高亮定位。
7) revisedResume 输出一版可直接参考的改写文本，保持简体中文，结构清晰，强调可量化成果。
`;

  const response = await fetch(`${SILICONFLOW_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SILICONFLOW_API_KEY}`
    },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
      temperature: 0.2,
      max_tokens: 1600,
      stream: false,
      messages: [
        {
          role: 'system',
          content: '你是招聘与简历优化专家，必须严格输出 JSON。'
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
      `SiliconFlow 简历质检失败(${response.status}) ${errorText.slice(0, 120)}`,
      'SILICONFLOW_RESUME_REVIEW_FAILED',
      retryable
    );
  }

  const result = (await response.json()) as SiliconFlowChatResponse;
  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new ServiceError('SiliconFlow 简历质检未返回有效内容', 'SILICONFLOW_EMPTY_CONTENT', false);
  }

  const parsedPayload = extractJsonPayload(content);
  return normalizeResumeRewriteReview(parsedPayload, fallbackReview);
};

const callSiliconFlowDeepSeek = async (request: DeepSeekAdviceRequest): Promise<DeepSeekAdvice> => {
  if (!SILICONFLOW_API_KEY) {
    throw new ServiceError('未配置 SiliconFlow API Key，请检查环境变量', 'SILICONFLOW_KEY_MISSING', false);
  }

  const fallbackAdvice = buildDeepSeekAdvice(request);
  const prompt = `
请你扮演资深技术招聘顾问。基于输入的简历技能与岗位需求，输出结构化 JSON。

输入数据：
${JSON.stringify(request, null, 2)}

输出要求：
1) 只输出 JSON，不要 Markdown，不要额外解释。
2) 字段必须完整：model, summary, strengths, gapSkills, resumeOptimizations, learningPath, marketTips。
3) gapSkills 中每项包含 skill, priority(high/medium/low), reason, action。
4) learningPath 中每项包含 phase, focus, target。
5) 所有文本使用简体中文，内容面向求职者可执行建议。
`;

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
          content: '你是招聘与简历优化专家，必须严格输出 JSON。'
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

  const parsedPayload = extractJsonPayload(content);
  return normalizeDeepSeekAdvice(parsedPayload, fallbackAdvice);
};

const callSiliconFlowResumeParse = async (rawText: string): Promise<ResumeProfile> => {
  if (!SILICONFLOW_API_KEY) {
    throw new ServiceError('未配置 SiliconFlow API Key，请检查环境变量', 'SILICONFLOW_KEY_MISSING', false);
  }

  const fallbackProfile = createResumeProfile(rawText);
  const prompt = `
请你扮演招聘数据分析师，对候选人简历进行结构化解析。

简历文本：
${normalizeTextForPrompt(rawText).slice(0, 8000)}

输出要求：
1) 仅输出 JSON，不要 Markdown，不要解释。
2) 只包含这些字段：extractedSkills, experienceYears, education, targetJobs。
3) extractedSkills 为字符串数组，尽量提取技术技能与工程能力关键词。
4) experienceYears 为数字（可取 0-20）。
5) education 从 [博士, 硕士, 本科, 大专] 中选择最贴近项。
6) targetJobs 必须从以下岗位中选择：${Object.keys(JOB_SKILL_REQUIREMENT_MAP).join('、')}。
`;

  const response = await fetch(`${SILICONFLOW_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SILICONFLOW_API_KEY}`
    },
    body: JSON.stringify({
      model: SILICONFLOW_MODEL,
      temperature: 0.1,
      max_tokens: 1200,
      stream: false,
      messages: [
        {
          role: 'system',
          content: '你是简历解析专家，必须严格输出 JSON，不允许输出其他内容。'
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
      `SiliconFlow 简历解析失败(${response.status}) ${errorText.slice(0, 120)}`,
      'SILICONFLOW_RESUME_PARSE_FAILED',
      retryable
    );
  }

  const result = (await response.json()) as SiliconFlowChatResponse;
  const content = result.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new ServiceError('SiliconFlow 简历解析未返回有效内容', 'SILICONFLOW_EMPTY_CONTENT', false);
  }

  const parsedPayload = extractJsonPayload(content);
  return normalizeResumeProfileByAI(parsedPayload, fallbackProfile);
};

export const resumeService = {
  getRequiredSkillsByJob,

  analyzeResumeText: async (rawText: string): Promise<ResumeProfile> => {
    const response = await requestWithMock<ResumeProfile>({
      endpoint: '/api/recruitment/ai/resume/parse',
      method: 'POST',
      useMock: !ENABLE_REAL_DEEPSEEK,
      retries: 2,
      mockHandler: async () => {
        await delay(520);
        return createResumeProfile(rawText);
      },
      realHandler: async () => {
        return callSiliconFlowResumeParse(rawText);
      }
    });
    return unwrapResponse(response);
  },

  analyzeResumeFile: async (file: File): Promise<ResumeProfile> => {
    const text = await file.text();
    return resumeService.analyzeResumeText(text);
  },

  matchResumeToJob: async (
    resume: ResumeProfile,
    jobTitle: string,
    requiredSkills?: string[]
  ): Promise<ResumeJobMatchResult> => {
    const normalizedRequiredSkills = requiredSkills && requiredSkills.length > 0
      ? requiredSkills
      : getRequiredSkillsByJob(jobTitle);

    const response = await requestWithMock<ResumeJobMatchResult>({
      endpoint: '/api/recruitment/ai/resume/match',
      method: 'POST',
      retries: 2,
      mockHandler: async () => {
        await delay(420);
        return buildMatchResult(resume, jobTitle, normalizedRequiredSkills);
      }
    });

    return unwrapResponse(response);
  },

  generateDeepSeekAdvice: async (request: DeepSeekAdviceRequest): Promise<DeepSeekAdvice> => {
    const response = await requestWithMock<DeepSeekAdvice>({
      endpoint: '/api/recruitment/ai/deepseek/gap-analysis',
      method: 'POST',
      useMock: !ENABLE_REAL_DEEPSEEK,
      retries: 1,
      mockHandler: async () => {
        await delay(760);
        return buildDeepSeekAdvice(request);
      },
      realHandler: async () => {
        return callSiliconFlowDeepSeek(request);
      }
    });

    return unwrapResponse(response);
  },

  reviewAndRewriteResume: async (rawText: string): Promise<ResumeRewriteReview> => {
    const response = await requestWithMock<ResumeRewriteReview>({
      endpoint: '/api/recruitment/ai/resume/review-rewrite',
      method: 'POST',
      useMock: !ENABLE_REAL_DEEPSEEK,
      retries: 1,
      mockHandler: async () => {
        await delay(820);
        return buildResumeRewriteFallback(rawText);
      },
      realHandler: async () => {
        return callSiliconFlowResumeRewrite(rawText);
      }
    });

    return unwrapResponse(response);
  }
};
