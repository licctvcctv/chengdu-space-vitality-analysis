export const MOCK_RESUME_TEXT = `张三
前端开发工程师 / 5年经验

技术栈：TypeScript, JavaScript, React, Vue, Node.js, HTML5, CSS3, ECharts, Git, Docker
项目经历：
- 负责招聘数据可视化平台建设，完成岗位热榜、城市热力地图、报表导出功能。
- 与后端协作完成 REST API 对接，落地登录鉴权、权限控制、异常处理。
- 参与性能优化，页面首屏加载降低 32%。`;

export const MARKET_HOT_SKILLS = [
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'Docker',
  'Kubernetes',
  'Spark',
  'LLM应用',
  'Prompt工程'
];

export const JOB_SKILL_REQUIREMENT_MAP: Record<string, string[]> = {
  '前端开发工程师': ['TypeScript', 'React', '工程化', '性能优化', '可视化'],
  'Java后端开发': ['Java', 'Spring Boot', 'MySQL', 'Redis', '微服务'],
  '算法工程师(AIGC)': ['Python', '机器学习', 'LLM应用', 'Prompt工程', '向量数据库'],
  '数据平台架构师': ['Spark', 'Flink', 'Kafka', '数据建模', '云原生'],
  '机器学习平台工程师': ['Python', '机器学习', 'MLOps', 'Docker', 'Kubernetes'],
  '数据分析师': ['SQL', 'Python', '统计分析', '可视化', '业务洞察'],
  '测试开发工程师': ['自动化测试', 'Python', 'CI/CD', '质量体系', '性能测试'],
  '产品经理': ['需求分析', '数据分析', '用户研究', '项目管理', '沟通协同'],
  '信息安全工程师': ['网络安全', '渗透测试', '安全运营', '应急响应', '日志审计'],
  'Prompt工程师': ['LLM应用', 'Prompt工程', '知识库', 'RAG', '评测体系']
};

export const FALLBACK_REQUIRED_SKILLS = ['TypeScript', '数据分析', '可视化', '沟通协作', '问题定位'];
