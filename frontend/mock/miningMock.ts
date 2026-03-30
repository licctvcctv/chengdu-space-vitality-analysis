import { WordCloudItem } from '../types';

const SKILL_KEYWORDS = [
  'TypeScript', 'Java', 'Python', 'React', 'Spring Boot', 'Vue', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
  'Flink', 'Spark', 'LLM', 'Prompt Engineering', 'GraphQL', 'PostgreSQL', 'Go', 'ClickHouse', 'Airflow', 'TensorFlow',
  'PyTorch', 'Data Governance', 'CI/CD', 'GitOps', 'A/B Testing', 'NLP', 'RAG', '向量数据库', '机器学习平台', '性能调优',
  'Kafka', 'Elasticsearch', 'Hadoop', 'Hive', 'Ray', 'MLOps', 'SRE', '微服务', '云原生', '大模型应用',
  'Agent开发', '多模态', '数据中台', '实时数仓', '风控建模', '推荐系统', '搜索排序', '低代码平台', '前端工程化', '跨端开发',
  'Android', 'iOS', 'Flutter', 'React Native', 'Rust', 'C++', 'Scala', 'Shell', 'Linux', 'Nginx',
  '网络安全', '渗透测试', '零信任', 'IAM', '容器安全', '隐私计算', '区块链', '工业互联网', '数据可视化', 'BI建模',
  '业务分析', '产品分析', '增长模型', '用户画像', '时序预测', '知识图谱', '图数据库', 'MapReduce', '服务网格', '可观测性'
];

export const MOCK_MINING_KEYWORDS: WordCloudItem[] = SKILL_KEYWORDS.map((name, index) => ({
  name,
  value: Number(Math.max(0.18, 0.98 - index * 0.01).toFixed(3)),
  count: Math.max(1200, 18600 - index * 220)
}));
