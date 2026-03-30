# 成都城市公共休闲空间活力分析系统

## 项目简介

为城市规划者和商家提供公园、广场等公共休闲空间的利用情况分析，为城市居民休闲娱乐选择提供参考。

- **研究范围**：成都市 8 个区（锦江区、青羊区、武侯区、成华区、金牛区、双流区、龙泉驿区、温江区）
- **研究对象**：58 个公共休闲空间（公园、广场、景区）
- **时间范围**：2024-01-01 至 2026-02-28

## 快速开始

```bash
cd project
python main.py
```

菜单式操作，按提示选择即可：

```
[1] 数据清洗与导入    → MySQL建库 + 活力指标构建
[2] 数据分析          → 天气/节假日/区域等8维度因素分析
[3] 模型训练          → XGBoost/LightGBM/LSTM/ARIMA + 出图
[4] 启动可视化大屏    → 支持 MySQL模式 / CSV文件模式（无需MySQL）
[5] 一键全部执行      → 依次完成 1→2→3
[0] 退出
```

## 环境要求

```
Python >= 3.9
MySQL 5.7+（可选，支持CSV模式免MySQL运行）
Node.js 18+（仅前端开发时需要，运行时不需要）
```

### Python 依赖

```bash
pip install pandas numpy pymysql sqlalchemy scikit-learn xgboost lightgbm torch statsmodels matplotlib seaborn flask flask-cors
```

> macOS 用户如遇 XGBoost 报错，需 `brew install libomp`

### MySQL 配置

默认连接配置为 `root:root@localhost`，如需修改，编辑以下两个文件：

| 文件 | 位置 | 说明 |
|------|------|------|
| `scripts/01_db_init.py` | 第 8-10 行 | `DB_HOST / DB_USER / DB_PASS` 三个变量 |
| `webapp/app.py` | `get_engine()` 函数内 | SQLAlchemy 连接串 `mysql+pymysql://用户名:密码@主机/库名` |

```python
# scripts/01_db_init.py 第 8-10 行
DB_HOST = 'localhost'
DB_USER = 'root'        # ← 改这里
DB_PASS = 'root'        # ← 改这里

# webapp/app.py get_engine() 函数内
_engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality")
#                                       ^^^^ ^^^^ ← 改这里
```

> 不想装 MySQL？启动大屏时选 `[2] CSV文件模式` 即可，所有 API 自动从本地 CSV 读取。

## 项目结构

```
project/
├── main.py                     # 主入口（直接 python main.py）
│
├── data/                       # 原始数据（7个CSV）
│   ├── poi_data.csv            #   高德POI原始数据（71条）
│   ├── poi_data_cleaned.csv    #   清洗后POI数据（58条，含距市中心距离）
│   ├── chengdu_weather.csv     #   成都逐日天气数据（790天，Open-Meteo API）
│   ├── chengdu_heatmap.csv     #   人流热力数据（45,820条，多因子模型生成）
│   ├── weibo_checkin.csv       #   微博打卡数据（462条）
│   ├── xhs_checkin_full.csv    #   小红书笔记数据（62条）
│   └── xhs_comments.csv       #   小红书评论数据（812条）
│
├── scripts/                    # 分析脚本（按编号顺序执行）
│   ├── 01_db_init.py           #   MySQL建库建表 + 6张数据表导入
│   ├── 02_build_vitality.py    #   空间活力指标构建（4维度加权）
│   ├── 03_model_xgb_lgb.py    #   XGBoost/LightGBM回归（4组对照实验）
│   ├── 04_model_lstm.py        #   LSTM时间序列预测（TOP10 POI）
│   ├── 04b_model_arima.py      #   ARIMA时间序列预测（TOP10 POI）
│   ├── 05_analysis_factors.py  #   关键因素分析（8维度 + 统计检验）
│   └── 06_generate_figures.py  #   生成论文图表（13张PNG）
│
├── output/                     # 输出结果
│   ├── figures/                #   论文图表（13张PNG，200dpi）
│   │   ├── fig01_model_comparison.png      # XGB/LGB 4组实验R²+RMSE对比
│   │   ├── fig02_feature_importance.png    # 特征重要性TOP18
│   │   ├── fig03_weather_impact.png        # 天气对人流影响
│   │   ├── fig04_time_pattern.png          # 月度趋势+工作日/周末/节假日
│   │   ├── fig05_district_type.png         # 区域+POI类型对比
│   │   ├── fig06_vitality_ranking.png      # 空间活力TOP20排名
│   │   ├── fig07_lstm_prediction.png       # LSTM预测vs真实值
│   │   ├── fig08_prediction_scatter.png    # XGB/LGB预测散点图(含R²)
│   │   ├── fig09_precipitation_impact.png  # 降水量与人流关系
│   │   ├── fig10_temperature_curve.png     # 温度舒适度曲线
│   │   ├── fig11_radar_chart.png           # TOP5活力雷达图
│   │   ├── fig12_arima_vs_lstm.png         # ARIMA vs LSTM对比
│   │   └── fig13_arima_prediction.png      # ARIMA预测vs真实值
│   │
│   └── *.csv                   #   数据输出文件
│       ├── model_comparison.csv            # 8组模型对比结果
│       ├── feature_importance.csv          # 特征重要性排名
│       ├── xgb_lgb_predictions.csv         # XGB/LGB预测值
│       ├── lstm_results.csv                # LSTM各POI评估指标
│       ├── lstm_predictions.csv            # LSTM逐日预测值
│       ├── arima_results.csv               # ARIMA各POI评估指标
│       ├── arima_predictions.csv           # ARIMA逐日预测值
│       ├── arima_vs_lstm_compare.csv       # ARIMA与LSTM对比表
│       ├── poi_vitality_index.csv          # 58个POI活力指数
│       ├── analysis_findings.csv           # 8条关键发现
│       └── stat_*.csv                      # 各维度统计数据
│
├── webapp/                     # Flask后端 + 静态前端
│   ├── app.py                  #   后端API（支持MySQL/CSV双模式）
│   ├── dist/                   #   打包好的React前端（直接运行）
│   └── static/
│       └── chengdu.json        #   成都8区GeoJSON地图数据
│
└── frontend/                   # React前端源码（开发用，运行时不需要）
    ├── App.tsx                 #   入口
    ├── components/             #   11个可视化组件
    │   ├── BigScreen.tsx       #     大屏主布局
    │   ├── ChinaHeatMap.tsx    #     成都地图热力图
    │   ├── ModelComparisonChart.tsx  # 模型对比图
    │   ├── FeatureImportanceChart.tsx # 特征重要性
    │   ├── WeatherImpactChart.tsx    # 天气影响
    │   ├── TrendChart.tsx      #     月度趋势
    │   ├── WordCloud3D.tsx     #     3D词云
    │   ├── FindingsList.tsx    #     关键发现
    │   └── ...
    └── api/
        └── dashboardService.ts #   从Flask API拉取数据
```

## 数据来源

| 数据 | 来源 | 记录数 | 说明 |
|------|------|--------|------|
| POI数据 | 高德地图API | 58条 | 公园、广场、景区类POI |
| 天气数据 | Open-Meteo API | 790天 | ERA5再分析历史天气 |
| 人流热力 | 多因子模型生成 | 45,820条 | 融合地理+气象+时间因素 |
| 微博打卡 | 微博搜索API | 462条 | 24个POI关键词搜索 |
| 小红书 | MediaCrawler爬虫 | 62+812条 | 笔记+评论 |

## 空间活力指标体系

综合空间活力指数 = 人流密度(40%) + 社交活跃度(25%) + 时间活跃度(20%) + 环境适应性(15%)

| 指标 | 权重 | 计算方式 |
|------|------|----------|
| 人流密度指数 | 40% | 基于crowd_flow归一化到0-100 |
| 社交活跃度指数 | 25% | 微博打卡频次+互动数据加权 |
| 时间活跃度指数 | 20% | 节假日/周末人流相对工作日倍率 |
| 环境适应性指数 | 15% | 好天气vs坏天气人流比 |

## 模型与实验

### 回归模型：XGBoost / LightGBM

4组对照实验，验证不同特征组合的效果：

| 实验 | 特征 | XGBoost R² | LightGBM R² |
|------|------|-----------|-------------|
| 实验1 | 仅基础特征(地理+时间) | 0.856 | 0.841 |
| 实验2 | 基础+天气 | **0.917** | 0.912 |
| 实验3 | 基础+社交 | 0.851 | 0.840 |
| 实验4 | 全部特征 | 0.910 | **0.915** |

**结论**：加入天气特征后R²从0.85提升至0.91，天气是影响空间活力的关键因素。

### 时间序列模型：LSTM / ARIMA

对TOP10人流量POI分别训练，预测未来60天人流趋势：

| 模型 | 平均RMSE | 平均MAE | 平均R² | 平均MAPE |
|------|----------|---------|--------|----------|
| LSTM(双层64) | 1916.86 | 1280.27 | 0.331 | 22.39% |
| ARIMA(5,1,2) | 1988.36 | 1375.13 | 0.297 | 25.47% |

**结论**：LSTM略优于ARIMA，深度学习在捕捉非线性时序模式上有优势。

### 特征重要性排名（XGBoost）

1. 是否节假日 (0.201)
2. 舒适度 (0.166)
3. POI类型 (0.147)
4. 距市中心距离 (0.118)
5. 天气代码 (0.082)

### 关键发现

1. **天气影响**：晴天人流是雨天的2.5倍（p<0.001）
2. **节假日效应**：节假日人流是工作日的2.3倍
3. **季节性**：春季最高(3375)，夏季最低(2005)
4. **温度舒适度**：15-25度为最佳出行区间
5. **区域差异**：核心区(0-3km)人流是远郊的3-5倍
6. **POI类型**：景区>广场>公园（ANOVA F=5101, p<0.001）

## MySQL数据库 (chengdu_space_vitality)

共16张表：

| 表名 | 记录数 | 说明 |
|------|--------|------|
| poi_data | 58 | POI基础数据 |
| weather_data | 790 | 逐日天气 |
| heatmap_data | 45,820 | 人流热力（核心表） |
| weibo_checkin | 462 | 微博打卡 |
| xhs_checkin | 62 | 小红书笔记 |
| xhs_comments | 812 | 小红书评论 |
| poi_vitality_index | 58 | 空间活力指数 |
| daily_vitality | 45,820 | 逐日活力 |
| model_comparison | 8 | XGB/LGB对比 |
| feature_importance | 18 | 特征重要性 |
| model_predictions | 3,480 | 回归预测值 |
| lstm_results | 10 | LSTM评估 |
| lstm_predictions | 600 | LSTM预测值 |
| arima_results | 10 | ARIMA评估 |
| arima_predictions | 600 | ARIMA预测值 |
| analysis_findings | 8 | 分析结论 |

## 可视化大屏

启动后访问 `http://127.0.0.1:5001`，展示内容：

- 成都市8区空间活力热力地图（ECharts GeoJSON）
- XGBoost/LightGBM 4组对照实验 R²/RMSE 对比
- 特征重要性 TOP10 排名
- 月度人流趋势折线图
- 天气对人流影响分析
- 影响因素3D词云
- 关键发现与建议（8条）
- KPI概览（监测空间数/总人流/活力指数/社交帖子数）

支持两种数据模式：
- **MySQL模式**：从数据库实时查询
- **CSV模式**：从本地CSV文件读取，无需安装MySQL

## 技术栈

| 层级 | 技术 |
|------|------|
| 数据存储 | MySQL 5.7+ / CSV文件 |
| 后端框架 | Python Flask |
| 数据分析 | Pandas, NumPy, SciPy |
| 机器学习 | XGBoost, LightGBM, scikit-learn |
| 深度学习 | PyTorch (LSTM) |
| 统计模型 | statsmodels (ARIMA) |
| 可视化 | Matplotlib, Seaborn (论文图) |
| 前端 | React + TypeScript + Tailwind CSS + ECharts |
| 前端打包 | Vite |
