"""
生成论文用图表 - 输出到 output/figures/
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from sqlalchemy import create_engine
import warnings
warnings.filterwarnings('ignore')

# ====== 中文字体 ======
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'PingFang SC', 'Heiti SC', 'SimHei']
plt.rcParams['axes.unicode_minus'] = False
plt.rcParams['figure.dpi'] = 200
plt.rcParams['savefig.bbox'] = 'tight'
plt.rcParams['savefig.pad_inches'] = 0.15

engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")
import os as _os; OUT = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'output', 'figures')

# 配色
C_BLUE = '#2563EB'
C_ORANGE = '#F59E0B'
C_GREEN = '#10B981'
C_RED = '#EF4444'
C_PURPLE = '#8B5CF6'
C_CYAN = '#06B6D4'
C_PINK = '#EC4899'
C_GRAY = '#6B7280'

def save(fig, name):
    fig.savefig(f'{OUT}/{name}.png')
    # fig.savefig(f'{OUT}/{name}.pdf')  # 不输出PDF
    plt.close(fig)
    print(f'  [OK] {name}.png')


print("="*60)
print("生成论文图表")
print("="*60)

# ====== 图1: 模型对比 - 4组对照实验 ======
print("\n[图1] 模型对照实验对比")
df_model = pd.read_sql("SELECT * FROM model_comparison", engine)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# R² 对比
exp_names = ['仅基础特征', '基础+天气', '基础+社交', '全部特征']
# 按顺序取: XGB在偶数行(0,2,4,6), LGB在奇数行(1,3,5,7)
xgb_r2 = df_model.iloc[::2]['R²'].tolist()
lgb_r2 = df_model.iloc[1::2]['R²'].tolist()

x = np.arange(len(exp_names))
w = 0.35
bars1 = ax1.bar(x - w/2, xgb_r2, w, label='XGBoost', color=C_BLUE, edgecolor='white', linewidth=0.5)
bars2 = ax1.bar(x + w/2, lgb_r2, w, label='LightGBM', color=C_ORANGE, edgecolor='white', linewidth=0.5)
ax1.set_ylabel('R²', fontsize=12)
ax1.set_title('(a) 各实验组R²对比', fontsize=13, fontweight='bold')
ax1.set_xticks(x)
ax1.set_xticklabels(exp_names, fontsize=10)
ax1.legend(fontsize=10)
ax1.set_ylim(0.8, 0.95)
ax1.grid(axis='y', alpha=0.3)
for bar in bars1:
    ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.002,
             f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=8)
for bar in bars2:
    ax1.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.002,
             f'{bar.get_height():.3f}', ha='center', va='bottom', fontsize=8)

# RMSE 对比
xgb_rmse = df_model.iloc[::2]['RMSE'].tolist()
lgb_rmse = df_model.iloc[1::2]['RMSE'].tolist()

bars3 = ax2.bar(x - w/2, xgb_rmse, w, label='XGBoost', color=C_BLUE, edgecolor='white', linewidth=0.5)
bars4 = ax2.bar(x + w/2, lgb_rmse, w, label='LightGBM', color=C_ORANGE, edgecolor='white', linewidth=0.5)
ax2.set_ylabel('RMSE', fontsize=12)
ax2.set_title('(b) 各实验组RMSE对比', fontsize=13, fontweight='bold')
ax2.set_xticks(x)
ax2.set_xticklabels(exp_names, fontsize=10)
ax2.legend(fontsize=10)
ax2.grid(axis='y', alpha=0.3)
for bar in bars3:
    ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 5,
             f'{bar.get_height():.0f}', ha='center', va='bottom', fontsize=8)
for bar in bars4:
    ax2.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 5,
             f'{bar.get_height():.0f}', ha='center', va='bottom', fontsize=8)

fig.tight_layout()
save(fig, 'fig01_model_comparison')


# ====== 图2: 特征重要性 ======
print("[图2] 特征重要性排名")
df_feat = pd.read_sql("SELECT * FROM feature_importance ORDER BY importance DESC", engine)

fig, ax = plt.subplots(figsize=(8, 6))
colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(df_feat)))[::-1]
bars = ax.barh(range(len(df_feat)), df_feat['importance'].values[::-1], color=colors, edgecolor='white', linewidth=0.5)
ax.set_yticks(range(len(df_feat)))
ax.set_yticklabels(df_feat['feature_cn'].values[::-1], fontsize=11)
ax.set_xlabel('重要性得分', fontsize=12)
ax.set_title('XGBoost特征重要性排名', fontsize=14, fontweight='bold')
ax.grid(axis='x', alpha=0.3)
for i, bar in enumerate(bars):
    ax.text(bar.get_width() + 0.003, bar.get_y() + bar.get_height()/2.,
            f'{bar.get_width():.3f}', ha='left', va='center', fontsize=9)
save(fig, 'fig02_feature_importance')


# ====== 图3: 天气对人流影响 ======
print("[图3] 天气影响分析")
df_weather = pd.read_sql("SELECT * FROM stat_weather_impact ORDER BY avg_flow DESC", engine)

fig, ax = plt.subplots(figsize=(10, 5))
colors_w = []
for w in df_weather['weather']:
    if '晴' in w: colors_w.append(C_ORANGE)
    elif '云' in w or '阴' in w: colors_w.append(C_GRAY)
    elif '雪' in w: colors_w.append(C_CYAN)
    else: colors_w.append(C_BLUE)

ax.bar(range(len(df_weather)), df_weather['avg_flow'], color=colors_w, edgecolor='white', linewidth=0.5)
ax.set_xticks(range(len(df_weather)))
ax.set_xticklabels(df_weather['weather'], rotation=40, ha='right', fontsize=10)
ax.set_ylabel('平均日人流量（人次）', fontsize=12)
ax.set_title('不同天气条件下平均人流量对比', fontsize=14, fontweight='bold')
ax.grid(axis='y', alpha=0.3)
save(fig, 'fig03_weather_impact')


# ====== 图4: 季节+时间模式 ======
print("[图4] 季节与时间模式")
df_heatmap = pd.read_sql("SELECT * FROM heatmap_data", engine)
df_heatmap['date'] = pd.to_datetime(df_heatmap['date'])
df_heatmap['month'] = df_heatmap['date'].dt.month

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# 月度趋势
monthly = df_heatmap.groupby(df_heatmap['date'].dt.to_period('M'))['crowd_flow'].mean()
months_str = [str(m) for m in monthly.index]
ax1.fill_between(range(len(monthly)), monthly.values, alpha=0.3, color=C_BLUE)
ax1.plot(range(len(monthly)), monthly.values, color=C_BLUE, linewidth=2, marker='o', markersize=4)
ax1.set_xticks(range(0, len(monthly), 3))
ax1.set_xticklabels([months_str[i] for i in range(0, len(monthly), 3)], rotation=30, fontsize=9)
ax1.set_ylabel('平均日人流量', fontsize=12)
ax1.set_title('(a) 月度人流趋势', fontsize=13, fontweight='bold')
ax1.grid(alpha=0.3)

# 工作日/周末/节假日
workday_avg = df_heatmap[(df_heatmap['is_weekend']==0) & (df_heatmap['is_holiday']==0)].groupby('poi_type')['crowd_flow'].mean()
weekend_avg = df_heatmap[(df_heatmap['is_weekend']==1) & (df_heatmap['is_holiday']==0)].groupby('poi_type')['crowd_flow'].mean()
holiday_avg = df_heatmap[df_heatmap['is_holiday']==1].groupby('poi_type')['crowd_flow'].mean()

types = ['景区', '广场', '公园']
x = np.arange(len(types))
w = 0.25
ax2.bar(x - w, [workday_avg.get(t, 0) for t in types], w, label='工作日', color=C_BLUE)
ax2.bar(x, [weekend_avg.get(t, 0) for t in types], w, label='周末', color=C_GREEN)
ax2.bar(x + w, [holiday_avg.get(t, 0) for t in types], w, label='节假日', color=C_RED)
ax2.set_xticks(x)
ax2.set_xticklabels(types, fontsize=12)
ax2.set_ylabel('平均日人流量', fontsize=12)
ax2.set_title('(b) 不同时间类型人流对比', fontsize=13, fontweight='bold')
ax2.legend(fontsize=10)
ax2.grid(axis='y', alpha=0.3)

fig.tight_layout()
save(fig, 'fig04_time_pattern')


# ====== 图5: 区域对比 ======
print("[图5] 区域差异分析")
df_district = pd.read_sql("SELECT * FROM stat_district_impact ORDER BY avg_flow DESC", engine)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

colors_d = plt.cm.RdYlBu(np.linspace(0.2, 0.8, len(df_district)))
ax1.bar(range(len(df_district)), df_district['avg_flow'], color=colors_d, edgecolor='white', linewidth=0.5)
ax1.set_xticks(range(len(df_district)))
ax1.set_xticklabels(df_district['district'], fontsize=10, rotation=30)
ax1.set_ylabel('平均日人流量', fontsize=12)
ax1.set_title('(a) 各区域平均人流量', fontsize=13, fontweight='bold')
ax1.grid(axis='y', alpha=0.3)

# POI类型对比
df_type = pd.read_sql("SELECT * FROM stat_type_impact ORDER BY avg_flow DESC", engine)
ax2.bar(df_type['poi_type'], df_type['avg_flow'], color=[C_RED, C_BLUE, C_GREEN], edgecolor='white', width=0.5)
for i, v in enumerate(df_type['avg_flow']):
    ax2.text(i, v + 50, f'{v:.0f}', ha='center', fontsize=11, fontweight='bold')
ax2.set_ylabel('平均日人流量', fontsize=12)
ax2.set_title('(b) 不同POI类型人流对比', fontsize=13, fontweight='bold')
ax2.grid(axis='y', alpha=0.3)

fig.tight_layout()
save(fig, 'fig05_district_type')


# ====== 图6: 空间活力指数排名 ======
print("[图6] 空间活力指数排名")
df_vitality = pd.read_sql("""
    SELECT poi_name, district, space_vitality_index, vitality_level
    FROM poi_vitality_index ORDER BY space_vitality_index DESC LIMIT 20
""", engine)

fig, ax = plt.subplots(figsize=(10, 7))
level_colors = {'高': C_RED, '较高': C_ORANGE, '中等': C_GREEN, '较低': C_BLUE, '低': C_GRAY}
colors_v = [level_colors.get(l, C_GRAY) for l in df_vitality['vitality_level'].values[::-1]]
bars = ax.barh(range(len(df_vitality)), df_vitality['space_vitality_index'].values[::-1],
               color=colors_v, edgecolor='white', linewidth=0.5)
ax.set_yticks(range(len(df_vitality)))
labels = [f"{n} ({d})" for n, d in zip(df_vitality['poi_name'].values[::-1], df_vitality['district'].values[::-1])]
ax.set_yticklabels(labels, fontsize=10)
ax.set_xlabel('空间活力指数', fontsize=12)
ax.set_title('成都公共休闲空间活力指数TOP20', fontsize=14, fontweight='bold')
ax.grid(axis='x', alpha=0.3)
for bar in bars:
    ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height()/2.,
            f'{bar.get_width():.1f}', ha='left', va='center', fontsize=9)
save(fig, 'fig06_vitality_ranking')


# ====== 图7: LSTM预测结果 ======
print("[图7] LSTM预测 vs 真实值")
df_lstm = pd.read_sql("SELECT * FROM lstm_predictions", engine)

# 选3个代表性POI
show_pois = ['人民公园', '浣花溪公园', '黄龙溪古镇']
fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))

for ax, poi in zip(axes, show_pois):
    sub = df_lstm[df_lstm['poi_name'] == poi].sort_values('date')
    ax.plot(range(len(sub)), sub['actual'], color=C_BLUE, linewidth=1.5, label='真实值', alpha=0.8)
    ax.plot(range(len(sub)), sub['lstm_predicted'], color=C_RED, linewidth=1.5, label='LSTM预测', linestyle='--', alpha=0.8)
    ax.fill_between(range(len(sub)), sub['actual'], sub['lstm_predicted'], alpha=0.1, color=C_PURPLE)
    ax.set_title(poi, fontsize=13, fontweight='bold')
    ax.set_xlabel('天数', fontsize=11)
    ax.set_ylabel('人流量', fontsize=11)
    ax.legend(fontsize=9)
    ax.grid(alpha=0.3)

fig.suptitle('LSTM时间序列预测结果对比', fontsize=14, fontweight='bold', y=1.02)
fig.tight_layout()
save(fig, 'fig07_lstm_prediction')


# ====== 图8: XGBoost预测散点图 ======
print("[图8] XGBoost预测散点图")
df_pred = pd.read_sql("SELECT * FROM model_predictions", engine)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# XGBoost
ax1.scatter(df_pred['crowd_flow'], df_pred['xgb_predicted'], alpha=0.3, s=8, color=C_BLUE, edgecolors='none')
max_val = max(df_pred['crowd_flow'].max(), df_pred['xgb_predicted'].max())
ax1.plot([0, max_val], [0, max_val], 'r--', linewidth=1.5, alpha=0.7, label='理想拟合线')
ax1.set_xlabel('真实值', fontsize=12)
ax1.set_ylabel('预测值', fontsize=12)
ax1.set_title('(a) XGBoost 预测 vs 真实', fontsize=13, fontweight='bold')
from sklearn.metrics import r2_score
r2_xgb = r2_score(df_pred['crowd_flow'], df_pred['xgb_predicted'])
ax1.text(0.05, 0.92, f'R²={r2_xgb:.4f}', transform=ax1.transAxes, fontsize=12,
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
ax1.legend(fontsize=10)
ax1.grid(alpha=0.3)

# LightGBM
ax2.scatter(df_pred['crowd_flow'], df_pred['lgb_predicted'], alpha=0.3, s=8, color=C_ORANGE, edgecolors='none')
ax2.plot([0, max_val], [0, max_val], 'r--', linewidth=1.5, alpha=0.7, label='理想拟合线')
ax2.set_xlabel('真实值', fontsize=12)
ax2.set_ylabel('预测值', fontsize=12)
ax2.set_title('(b) LightGBM 预测 vs 真实', fontsize=13, fontweight='bold')
r2_lgb = r2_score(df_pred['crowd_flow'], df_pred['lgb_predicted'])
ax2.text(0.05, 0.92, f'R²={r2_lgb:.4f}', transform=ax2.transAxes, fontsize=12,
         bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
ax2.legend(fontsize=10)
ax2.grid(alpha=0.3)

fig.tight_layout()
save(fig, 'fig08_prediction_scatter')


# ====== 图9: 降水量与人流关系 ======
print("[图9] 降水量与人流关系")
fig, ax = plt.subplots(figsize=(8, 5))

precip_bins = [0, 0.1, 5, 10, 20, 50, 200]
labels = ['无降水', '0-5mm', '5-10mm', '10-20mm', '20-50mm', '>50mm']
df_heatmap['precip_cat'] = pd.cut(df_heatmap['precipitation_mm'], bins=precip_bins, labels=labels, include_lowest=True)
precip_flow = df_heatmap.groupby('precip_cat', observed=True)['crowd_flow'].mean()

colors_p = [C_ORANGE, C_GREEN, C_CYAN, C_BLUE, C_PURPLE, C_RED]
ax.bar(range(len(precip_flow)), precip_flow.values, color=colors_p, edgecolor='white', linewidth=0.5)
ax.set_xticks(range(len(precip_flow)))
ax.set_xticklabels(labels, fontsize=11)
ax.set_ylabel('平均日人流量（人次）', fontsize=12)
ax.set_title('降水量等级与平均人流量关系', fontsize=14, fontweight='bold')
ax.grid(axis='y', alpha=0.3)
for i, v in enumerate(precip_flow.values):
    ax.text(i, v + 30, f'{v:.0f}', ha='center', fontsize=10)
save(fig, 'fig09_precipitation_impact')


# ====== 图10: 温度舒适度与人流 ======
print("[图10] 温度舒适度曲线")
df_heatmap['avg_temp'] = (df_heatmap['high_temp'] + df_heatmap['low_temp']) / 2
temp_bins = list(range(-5, 40, 2))
df_heatmap['temp_bin'] = pd.cut(df_heatmap['avg_temp'], bins=temp_bins)
temp_flow = df_heatmap.groupby('temp_bin', observed=True)['crowd_flow'].mean()

fig, ax = plt.subplots(figsize=(10, 5))
x_vals = [(b.left + b.right) / 2 for b in temp_flow.index]
ax.plot(x_vals, temp_flow.values, color=C_RED, linewidth=2.5, marker='o', markersize=5)
ax.fill_between(x_vals, temp_flow.values, alpha=0.15, color=C_RED)
ax.axvspan(15, 25, alpha=0.1, color=C_GREEN, label='最佳舒适区间(15-25℃)')
ax.set_xlabel('日平均温度（℃）', fontsize=12)
ax.set_ylabel('平均日人流量（人次）', fontsize=12)
ax.set_title('温度与人流量关系曲线', fontsize=14, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(alpha=0.3)
save(fig, 'fig10_temperature_curve')


# ====== 图11: 活力指标雷达图(TOP5) ======
print("[图11] TOP5 POI活力雷达图")
df_v = pd.read_sql("""
    SELECT poi_name, flow_density_index, social_activity_index,
           time_activity_index, weather_resilience_index
    FROM poi_vitality_index ORDER BY space_vitality_index DESC LIMIT 5
""", engine)

categories = ['人流密度', '社交活跃度', '时间活跃度', '环境适应性']
fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))

angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
angles += angles[:1]

colors_r = [C_BLUE, C_RED, C_GREEN, C_ORANGE, C_PURPLE]
for i, (_, row) in enumerate(df_v.iterrows()):
    values = [row['flow_density_index'], row['social_activity_index'],
              row['time_activity_index'], row['weather_resilience_index']]
    values += values[:1]
    ax.plot(angles, values, 'o-', linewidth=2, color=colors_r[i], label=row['poi_name'], markersize=5)
    ax.fill(angles, values, alpha=0.08, color=colors_r[i])

ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories, fontsize=12)
ax.set_ylim(0, 110)
ax.set_title('TOP5公共空间活力指标雷达图', fontsize=14, fontweight='bold', pad=20)
ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), fontsize=10)
save(fig, 'fig11_radar_chart')


# ====== 图12: ARIMA vs LSTM 对比 ======
print("[图12] ARIMA vs LSTM 模型对比")
try:
    df_compare = pd.read_sql("SELECT * FROM arima_vs_lstm", engine)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    x = np.arange(len(df_compare))
    w = 0.35
    ax1.bar(x - w/2, df_compare['ARIMA_R²'], w, label='ARIMA', color=C_ORANGE, edgecolor='white')
    ax1.bar(x + w/2, df_compare['LSTM_R²'], w, label='LSTM', color=C_BLUE, edgecolor='white')
    ax1.set_ylabel('R²', fontsize=12)
    ax1.set_title('(a) ARIMA vs LSTM — R²对比', fontsize=13, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(df_compare['POI'], fontsize=8, rotation=35, ha='right')
    ax1.legend(fontsize=10)
    ax1.grid(axis='y', alpha=0.3)

    ax2.bar(x - w/2, df_compare['ARIMA_RMSE'], w, label='ARIMA', color=C_ORANGE, edgecolor='white')
    ax2.bar(x + w/2, df_compare['LSTM_RMSE'], w, label='LSTM', color=C_BLUE, edgecolor='white')
    ax2.set_ylabel('RMSE', fontsize=12)
    ax2.set_title('(b) ARIMA vs LSTM — RMSE对比', fontsize=13, fontweight='bold')
    ax2.set_xticks(x)
    ax2.set_xticklabels(df_compare['POI'], fontsize=8, rotation=35, ha='right')
    ax2.legend(fontsize=10)
    ax2.grid(axis='y', alpha=0.3)

    fig.tight_layout()
    save(fig, 'fig12_arima_vs_lstm')
except Exception as e:
    print(f"  跳过: {e}")

# ====== 图13: ARIMA预测 vs 真实值 ======
print("[图13] ARIMA预测 vs 真实值")
try:
    df_arima = pd.read_sql("SELECT * FROM arima_predictions", engine)
    show_pois = ['人民公园', '浣花溪公园', '黄龙溪古镇']
    fig, axes = plt.subplots(1, 3, figsize=(15, 4.5))
    for ax, poi in zip(axes, show_pois):
        sub = df_arima[df_arima['poi_name'] == poi].sort_values('date')
        ax.plot(range(len(sub)), sub['actual'], color=C_BLUE, linewidth=1.5, label='真实值', alpha=0.8)
        ax.plot(range(len(sub)), sub['arima_predicted'], color=C_ORANGE, linewidth=1.5, label='ARIMA预测', linestyle='--', alpha=0.8)
        ax.set_title(poi, fontsize=13, fontweight='bold')
        ax.set_xlabel('天数', fontsize=11)
        ax.set_ylabel('人流量', fontsize=11)
        ax.legend(fontsize=9)
        ax.grid(alpha=0.3)
    fig.suptitle('ARIMA时间序列预测结果对比', fontsize=14, fontweight='bold', y=1.02)
    fig.tight_layout()
    save(fig, 'fig13_arima_prediction')
except Exception as e:
    print(f"  跳过: {e}")


print(f"\n{'='*60}")
print(f"全部图表已生成至: {OUT}/")
print(f"共 13 张图（PNG格式）")
print(f"{'='*60}")
