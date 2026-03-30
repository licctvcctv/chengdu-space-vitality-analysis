# 成都城市公共休闲空间活力分析系统

> Chengdu Urban Public Space Vitality Analysis System

基于多源数据融合的城市公共休闲空间活力评估与预测系统。通过采集高德地图 POI、天气、微博/小红书社交打卡、人口热力图等多维度数据，构建空间活力指标体系，运用 XGBoost、LightGBM、LSTM、ARIMA 等模型预测不同时间和天气条件下的空间活力变化，为城市规划者和商家提供数据支撑，为市民休闲出行提供参考。

---

## 研究概况

| 项目 | 内容 |
|------|------|
| 研究区域 | 成都市 8 个主城区（锦江、青羊、武侯、成华、金牛、双流、龙泉驿、温江） |
| 研究对象 | 58 个公共休闲空间（11 个景区、43 个广场、4 个公园） |
| 时间跨度 | 2024-01-01 至 2026-02-28（共 790 天） |
| 数据总量 | 47,996 条（POI 58 + 天气 790 + 热力 45,820 + 微博 462 + 小红书 62 + 评论 812） |

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/licctvcctv/chengdu-space-vitality-analysis.git
cd chengdu-space-vitality-analysis
```

### 2. 安装 Python 依赖

```bash
pip install pandas numpy pymysql sqlalchemy scikit-learn \
            xgboost lightgbm torch statsmodels \
            matplotlib seaborn flask flask-cors
```

> macOS 用户如遇 XGBoost 加载失败，执行 `brew install libomp` 安装 OpenMP 运行时。

### 3. 运行主程序

```bash
python main.py
```

启动后显示交互式菜单：

```
==========================================================
   成都城市公共休闲空间活力分析系统
   Chengdu Urban Public Space Vitality Analysis
==========================================================
  Python: /usr/bin/python3

  [1] 数据清洗与导入    → MySQL建库 + 活力指标构建
  [2] 数据分析          → 天气/节假日/区域等8维度因素分析
  [3] 模型训练          → XGBoost/LightGBM/LSTM/ARIMA + 出图
  [4] 启动可视化大屏    → 支持 MySQL模式 / CSV文件模式
  [5] 一键全部执行      → 依次完成 1→2→3
  [0] 退出
```

**首次使用建议**：选 `5` 一键执行全部流程，完成后选 `4` 启动大屏查看结果。

---

## 环境要求

| 环境 | 版本 | 是否必须 | 说明 |
|------|------|----------|------|
| Python | >= 3.9 | 是 | 推荐 3.9-3.12，3.14 可能存在兼容性问题 |
| MySQL | >= 5.7 | **否** | 启动大屏时可选 CSV 模式，完全免 MySQL |
| Node.js | >= 18 | **否** | 仅二次开发前端时需要，直接运行不需要 |
| libomp | 最新 | macOS 必须 | `brew install libomp`，XGBoost/LightGBM 依赖 |

---

## MySQL 配置

> 如果不使用 MySQL，启动大屏时选择 `[2] CSV文件模式` 即可跳过本节。

默认连接参数为 `root:root@localhost`，数据库名 `chengdu_space_vitality`。

**需要修改密码/主机时，编辑以下两处：**

#### 位置一：`scripts/01_db_init.py` 第 8-10 行

```python
DB_HOST = 'localhost'       # ← 数据库主机
DB_USER = 'root'            # ← 用户名
DB_PASS = 'root'            # ← 密码
DB_NAME = 'chengdu_space_vitality'  # ← 数据库名（自动创建）
```

#### 位置二：`webapp/app.py` 中的 `get_engine()` 函数

```python
def get_engine():
    global _engine
    if _engine is None:
        from sqlalchemy import create_engine
        _engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality")
        #                                       ^^^^:^^^^@^^^^^^^^^
        #                                       用户名:密码@主机
    return _engine
```

**两处的用户名、密码、主机需保持一致。**

---

## 项目结构

```
.
├── main.py                         # 主入口（交互式菜单）
│
├── data/                           # 原始数据（7 个 CSV）
│   ├── poi_data.csv                #   高德 POI 原始数据（71 条）
│   ├── poi_data_cleaned.csv        #   清洗后 POI（58 条，含距市中心距离）
│   ├── chengdu_weather.csv         #   逐日天气（790 天，Open-Meteo API）
│   ├── chengdu_heatmap.csv         #   人流热力（45,820 条，多因子模型）
│   ├── weibo_checkin.csv           #   微博打卡（462 条）
│   ├── xhs_checkin_full.csv        #   小红书笔记（62 条）
│   └── xhs_comments.csv           #   小红书评论（812 条）
│
├── scripts/                        # 分析脚本（按编号顺序执行）
│   ├── 01_db_init.py              #   建库建表 + 导入 6 张数据表
│   ├── 02_build_vitality.py       #   构建空间活力指标（4 维度加权）
│   ├── 03_model_xgb_lgb.py       #   XGBoost / LightGBM（4 组对照实验）
│   ├── 04_model_lstm.py           #   LSTM 时间序列预测
│   ├── 04b_model_arima.py         #   ARIMA 时间序列预测
│   ├── 05_analysis_factors.py     #   关键因素分析（8 维度 + 统计检验）
│   └── 06_generate_figures.py     #   生成论文图表（13 张 PNG）
│
├── output/                         # 运行输出
│   ├── figures/                    #   13 张论文图表（200dpi PNG）
│   └── *.csv                       #   建模结果 + 统计数据（约 15 个文件）
│
├── webapp/                         # Web 服务
│   ├── app.py                     #   Flask 后端（支持 MySQL / CSV 双模式）
│   ├── dist/                      #   打包好的 React 前端（直接运行）
│   └── static/chengdu.json        #   成都 8 区 GeoJSON 地图
│
└── frontend/                       # React 前端源码（开发用，运行时不需要）
    ├── components/                #   11 个可视化组件
    ├── api/                       #   数据请求层
    └── hooks/                     #   React Hooks
```

---

## 数据来源

| 数据类型 | 数据源 | 采集方式 | 记录数 | 字段示例 |
|----------|--------|----------|--------|----------|
| POI 地理数据 | 高德地图 API | 关键词搜索（公园/广场/景区） | 58 条 | 名称、经纬度、区域、类型、距市中心距离 |
| 天气数据 | Open-Meteo API | ERA5 再分析历史数据 | 790 天 | 日期、最高/低温、天气代码、降水量、风速 |
| 人流热力数据 | 多因子模型生成 | 融合地理+气象+时间因素 | 45,820 条 | 日期、POI、人流量、天气、温度、节假日标记 |
| 微博打卡 | 微博搜索 API | 24 个 POI 关键词搜索 | 462 条 | 发帖日期、内容、点赞/评论/转发、社交活跃度 |
| 小红书笔记 | MediaCrawler 爬虫 | 关键词搜索 | 62 条 | 标题、描述、点赞/收藏/评论/分享、IP 属地 |
| 小红书评论 | MediaCrawler 爬虫 | 笔记评论抓取 | 812 条 | 评论内容、点赞数、IP 属地 |

---

## 分析流程

### 第一阶段：数据清洗与导入（脚本 01-02）

1. **MySQL 建库建表**：自动创建 `chengdu_space_vitality` 数据库及 6 张原始数据表
2. **POI 数据清洗**：过滤公交站/停车场等噪声，计算每个 POI 到天府广场（市中心）的 Haversine 距离
3. **空间活力指标构建**：

| 指标 | 权重 | 数据来源 | 计算逻辑 |
|------|------|----------|----------|
| 人流密度指数 | 40% | 热力数据 | crowd_flow 归一化至 0-100 |
| 社交活跃度指数 | 25% | 微博打卡 | 打卡频次 × 3 + 点赞 × 1 + 评论 × 2 + 转发 × 3 |
| 时间活跃度指数 | 20% | 热力数据 | (周末均值 + 节假日均值) / (2 × 工作日均值) |
| 环境适应性指数 | 15% | 热力数据 | 坏天气人流 / 好天气人流 |

最终综合指数 = 加权求和，按 0-20-40-60-80-100 划分为低/较低/中等/较高/高五个等级。

### 第二阶段：数据分析（脚本 05）

对 45,820 条热力数据进行 8 个维度的统计分析：

| 维度 | 分析方法 | 核心结论 |
|------|----------|----------|
| 天气影响 | 独立样本 t 检验 | 晴天均流 4,040 vs 雨天 1,594（p < 0.001） |
| 节假日效应 | 分组均值对比 | 节假日 5,093 = 工作日 2,219 × 2.3 倍 |
| 季节性 | 月度聚合 | 春季 3,375 > 秋季 3,333 > 冬季 2,106 > 夏季 2,005 |
| 温度舒适度 | 分箱统计 | 15-25 度最佳，<5 度人流降至 1,300 |
| 降水量 | 分级统计 | 每增 10mm 人流下降约 20-30% |
| 区域差异 | 分组聚合 | 青羊区 4,684 > 锦江区 4,075 > ... > 温江区 799 |
| POI 类型 | 单因素方差分析 | 景区 4,985 > 广场 2,183 > 公园 1,405（F=5101, p<0.001） |
| 距离衰减 | 相关分析 | r = -0.333，核心区人流是远郊 3-5 倍 |

### 第三阶段：模型训练（脚本 03-04b-06）

#### 回归模型：XGBoost / LightGBM

设计 4 组对照实验，逐步叠加特征验证贡献度：

| 实验组 | 特征集 | XGBoost R² | XGBoost RMSE | LightGBM R² | LightGBM RMSE |
|--------|--------|-----------|-------------|-------------|---------------|
| 实验 1 | 基础（地理 + 时间） | 0.856 | 845 | 0.841 | 887 |
| 实验 2 | 基础 + 天气 | **0.917** | **640** | 0.912 | 659 |
| 实验 3 | 基础 + 社交 | 0.851 | 857 | 0.840 | 889 |
| 实验 4 | 全部特征 | 0.910 | 668 | **0.915** | **647** |

**关键发现**：加入天气特征后 R² 从 0.85 跃升至 0.91（提升 7%），证实天气是预测空间活力的最关键外部因素。

特征重要性排名（XGBoost，全特征模型）：

| 排名 | 特征 | 重要性得分 |
|------|------|-----------|
| 1 | 是否节假日 | 0.201 |
| 2 | 舒适度指数 | 0.166 |
| 3 | POI 类型 | 0.147 |
| 4 | 距市中心距离 | 0.118 |
| 5 | 天气代码 | 0.082 |
| 6 | 是否周末 | 0.063 |
| 7 | 所在区域 | 0.062 |
| 8 | 社交活跃度 | 0.046 |

#### 时间序列模型：LSTM / ARIMA

对日均人流量 TOP10 的 POI 分别训练，用前 30 天预测下 1 天，测试集为最后 60 天：

| 模型 | 架构 | 平均 RMSE | 平均 MAE | 平均 R² | 平均 MAPE |
|------|------|-----------|---------|--------|-----------|
| LSTM | 双层 64 单元 + Dropout 0.2 | 1,917 | 1,280 | 0.331 | 22.4% |
| ARIMA | ARIMA(5,1,2) 滚动预测 | 1,988 | 1,375 | 0.297 | 25.5% |

**分析**：
- 回归模型（R²=0.91）远优于时序模型（R²=0.33），因为前者融合了 18 个多源特征
- LSTM 略优于 ARIMA，深度学习对非线性波动的捕捉能力更强
- 时序模型仅用单一历史人流量，信息量有限，MAPE 在 22-26% 属合理范围

---

## 输出文件说明

### 论文图表（`output/figures/`，共 13 张）

| 文件名 | 内容 | 适用论文章节 |
|--------|------|-------------|
| fig01_model_comparison | XGB/LGB 4 组实验 R² + RMSE 对比 | 模型评估 |
| fig02_feature_importance | 特征重要性 TOP18 横条图 | 特征分析 |
| fig03_weather_impact | 12 种天气下平均人流量 | 天气因素 |
| fig04_time_pattern | 月度趋势 + 工作日/周末/节假日 | 时间因素 |
| fig05_district_type | 区域对比 + POI 类型对比 | 空间因素 |
| fig06_vitality_ranking | 空间活力 TOP20 排名 | 综合评价 |
| fig07_lstm_prediction | LSTM 预测 vs 真实值（3 个 POI） | 时序模型 |
| fig08_prediction_scatter | XGB/LGB 预测散点图（含 R²） | 模型评估 |
| fig09_precipitation_impact | 降水量等级与人流关系 | 降水分析 |
| fig10_temperature_curve | 温度舒适度曲线（标注最佳区间） | 温度分析 |
| fig11_radar_chart | TOP5 活力雷达图 | 综合评价 |
| fig12_arima_vs_lstm | ARIMA vs LSTM R²/RMSE 对比 | 模型对比 |
| fig13_arima_prediction | ARIMA 预测 vs 真实值 | 时序模型 |

### 数据文件（`output/*.csv`）

| 文件名 | 记录数 | 说明 |
|--------|--------|------|
| model_comparison.csv | 8 | XGB/LGB 4 组实验指标对比 |
| feature_importance.csv | 18 | 全部特征重要性排名 |
| xgb_lgb_predictions.csv | 3,480 | 回归模型逐日预测值 |
| lstm_results.csv | 10 | LSTM 各 POI 评估指标 |
| lstm_predictions.csv | 600 | LSTM 逐日预测值 |
| arima_results.csv | 10 | ARIMA 各 POI 评估指标 |
| arima_predictions.csv | 600 | ARIMA 逐日预测值 |
| arima_vs_lstm_compare.csv | 10 | 两种时序模型逐 POI 对比 |
| poi_vitality_index.csv | 58 | 全部 POI 活力指数及等级 |
| analysis_findings.csv | 8 | 关键发现 + 建议 |
| stat_weather_impact.csv | 12 | 各天气类型人流统计 |
| stat_season_impact.csv | 4 | 四季人流统计 |
| stat_district_impact.csv | 8 | 各区域人流统计 |
| stat_type_impact.csv | 3 | 各 POI 类型人流统计 |

---

## 可视化大屏

启动方式：`python main.py` → 选 `4` → 选数据模式 → 浏览器访问 `http://127.0.0.1:5001`

| 数据模式 | 说明 | 适用场景 |
|----------|------|----------|
| MySQL 模式 | 从数据库实时查询 | 已执行过步骤 1 导入数据 |
| CSV 模式 | 从 `data/` 和 `output/` 读取 CSV | 无 MySQL 环境，或快速演示 |

大屏包含 7 个可视化面板：

1. **成都地图热力图** — 8 区 GeoJSON 底图 + 人流量分级着色
2. **模型对比图** — XGBoost/LightGBM 4 组实验 R²/RMSE 柱线图
3. **特征重要性** — TOP10 横向条形图
4. **月度趋势** — 26 个月人流量折线图（含预测区间）
5. **天气影响** — 12 种天气条件下的人流量对比
6. **影响因素词云** — 3D 旋转词云球
7. **关键发现** — 8 条分析结论 + 规划建议

顶部 KPI 卡片实时展示：监测空间数、总人流量、平均活力指数、社交帖子数。

---

## MySQL 数据库表结构

数据库名：`chengdu_space_vitality`，共 16 张表。

### 原始数据表（步骤 1 创建）

| 表名 | 记录数 | 主要字段 |
|------|--------|----------|
| `poi_data` | 58 | id, name, lon, lat, district, type, dist_to_center_km |
| `weather_data` | 790 | date, high_temp, low_temp, weather_code, precipitation_mm, is_weekend, is_holiday |
| `heatmap_data` | 45,820 | date, poi_id, crowd_flow, weather, high_temp, precipitation_mm, is_weekend, is_holiday |
| `weibo_checkin` | 462 | post_date, poi_name, content, likes_count, social_activity_score |
| `xhs_checkin` | 62 | note_id, title, liked_count, collected_count, source_keyword |
| `xhs_comments` | 812 | comment_id, note_id, content, like_count, ip_location |

### 分析结果表（步骤 1-3 生成）

| 表名 | 记录数 | 说明 |
|------|--------|------|
| `poi_vitality_index` | 58 | 空间活力综合指数（4 维度 + 等级） |
| `daily_vitality` | 45,820 | 逐日活力得分 |
| `model_comparison` | 8 | XGB/LGB 4 组实验指标 |
| `feature_importance` | 18 | 特征重要性排名 |
| `model_predictions` | 3,480 | 回归预测值 |
| `lstm_results` | 10 | LSTM 评估指标 |
| `lstm_predictions` | 600 | LSTM 预测值 |
| `arima_results` | 10 | ARIMA 评估指标 |
| `arima_predictions` | 600 | ARIMA 预测值 |
| `analysis_findings` | 8 | 分析结论 |

---

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 数据存储 | MySQL 5.7+ / CSV | 结构化数据存取 |
| 后端 | Python Flask + flask-cors | API 服务 + 静态文件托管 |
| 数据处理 | Pandas, NumPy | 清洗、聚合、特征工程 |
| 统计分析 | SciPy (t 检验, ANOVA) | 显著性检验 |
| 机器学习 | XGBoost, LightGBM, scikit-learn | 回归预测 + 评估 |
| 深度学习 | PyTorch (LSTM) | 时间序列预测 |
| 统计建模 | statsmodels (ARIMA) | 经典时序基线 |
| 论文出图 | Matplotlib, Seaborn | 13 张学术图表 |
| 前端框架 | React 19 + TypeScript | 可视化大屏 |
| 前端样式 | Tailwind CSS | 暗色科技风主题 |
| 图表库 | ECharts 5.6 | 地图、柱状图、折线图、词云 |
| 前端打包 | Vite 6 | 构建静态文件 |
