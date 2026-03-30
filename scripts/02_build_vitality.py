"""
构建空间活力指标体系
将人流密度、社交活跃度等融合为综合"空间活力指数"，写入MySQL
"""
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")

# ====== 1. 读取数据 ======
heatmap_df = pd.read_sql("SELECT * FROM heatmap_data", engine)
weibo_df = pd.read_sql("SELECT * FROM weibo_checkin", engine)
poi_df = pd.read_sql("SELECT * FROM poi_data", engine)

print(f"热力数据: {len(heatmap_df)} 条, 微博数据: {len(weibo_df)} 条, POI: {len(poi_df)} 条")

# ====== 2. 计算各分项指标 ======

# 2.1 人流密度指标 (基于crowd_flow，归一化到0-100)
flow_min = heatmap_df['crowd_flow'].min()
flow_max = heatmap_df['crowd_flow'].max()
heatmap_df['flow_density_score'] = ((heatmap_df['crowd_flow'] - flow_min) / (flow_max - flow_min) * 100).round(2)

# 2.2 社交活跃度指标 (基于微博打卡频次和互动数据)
# 按POI和月份聚合微博数据
weibo_df['post_date'] = pd.to_datetime(weibo_df['post_date'], errors='coerce')
weibo_df['year_month'] = weibo_df['post_date'].dt.to_period('M').astype(str)

weibo_monthly = weibo_df.groupby(['poi_name', 'year_month']).agg(
    checkin_count=('poi_name', 'count'),
    total_likes=('likes_count', 'sum'),
    total_comments=('comments_count', 'sum'),
    total_reposts=('reposts_count', 'sum'),
    avg_activity_score=('social_activity_score', 'mean'),
).reset_index()

# 社交活跃度 = 打卡次数*3 + 点赞*1 + 评论*2 + 转发*3，归一化
weibo_monthly['social_score_raw'] = (
    weibo_monthly['checkin_count'] * 3 +
    weibo_monthly['total_likes'] +
    weibo_monthly['total_comments'] * 2 +
    weibo_monthly['total_reposts'] * 3
)

# 按POI计算社交活跃度得分（取平均水平）
poi_social = weibo_monthly.groupby('poi_name')['social_score_raw'].mean().reset_index()
poi_social.columns = ['poi_name', 'social_raw_avg']
s_min = poi_social['social_raw_avg'].min()
s_max = poi_social['social_raw_avg'].max()
if s_max > s_min:
    poi_social['social_activity_index'] = ((poi_social['social_raw_avg'] - s_min) / (s_max - s_min) * 100).round(2)
else:
    poi_social['social_activity_index'] = 50.0

# 没有微博数据的POI给一个基础分
all_poi_names = poi_df['name'].tolist()
poi_social_full = pd.DataFrame({'poi_name': all_poi_names})
poi_social_full = poi_social_full.merge(poi_social[['poi_name', 'social_activity_index']], on='poi_name', how='left')
poi_social_full['social_activity_index'] = poi_social_full['social_activity_index'].fillna(10.0)

# 2.3 时间活跃度指标 (节假日/周末人流相对工作日的倍率)
heatmap_df['date'] = pd.to_datetime(heatmap_df['date'])
poi_time_factor = heatmap_df.groupby('poi_name').apply(
    lambda g: pd.Series({
        'weekday_avg': g[g['is_weekend'] == 0]['crowd_flow'].mean(),
        'weekend_avg': g[g['is_weekend'] == 1]['crowd_flow'].mean(),
        'holiday_avg': g[g['is_holiday'] == 1]['crowd_flow'].mean(),
    })
).reset_index()
poi_time_factor['time_activity_ratio'] = (
    (poi_time_factor['weekend_avg'] + poi_time_factor['holiday_avg']) /
    (2 * poi_time_factor['weekday_avg'] + 0.01)
).round(3)
# 归一化
t_min = poi_time_factor['time_activity_ratio'].min()
t_max = poi_time_factor['time_activity_ratio'].max()
poi_time_factor['time_activity_index'] = ((poi_time_factor['time_activity_ratio'] - t_min) / (t_max - t_min) * 100).round(2)

# 2.4 环境适应性指标 (好天气vs坏天气人流比)
good_weather = heatmap_df[heatmap_df['weather_code'].isin([0, 1, 2])]['crowd_flow']
bad_weather = heatmap_df[heatmap_df['weather_code'].isin([61, 63, 65, 80, 81, 82, 95])]['crowd_flow']

poi_weather = heatmap_df.groupby('poi_name').apply(
    lambda g: pd.Series({
        'good_weather_avg': g[g['weather_code'].isin([0, 1, 2])]['crowd_flow'].mean(),
        'bad_weather_avg': g[g['weather_code'].isin([61, 63, 65, 80, 81, 82, 95])]['crowd_flow'].mean(),
    })
).reset_index()
poi_weather['weather_resilience'] = (poi_weather['bad_weather_avg'] / (poi_weather['good_weather_avg'] + 0.01)).round(3)
w_min = poi_weather['weather_resilience'].min()
w_max = poi_weather['weather_resilience'].max()
poi_weather['weather_resilience_index'] = ((poi_weather['weather_resilience'] - w_min) / (w_max - w_min) * 100).round(2)

# ====== 3. 综合空间活力指数 ======
# 权重: 人流密度40% + 社交活跃度25% + 时间活跃度20% + 环境适应性15%

# 先计算每个POI的平均人流密度得分
poi_flow = heatmap_df.groupby('poi_name')['flow_density_score'].mean().reset_index()
poi_flow.columns = ['poi_name', 'flow_density_index']

# 合并所有指标
vitality = poi_flow.copy()
vitality = vitality.merge(poi_social_full[['poi_name', 'social_activity_index']], on='poi_name', how='left')
vitality = vitality.merge(poi_time_factor[['poi_name', 'time_activity_index']], on='poi_name', how='left')
vitality = vitality.merge(poi_weather[['poi_name', 'weather_resilience_index']], on='poi_name', how='left')

# 填充缺失
vitality = vitality.fillna(0)

# 综合指数
vitality['space_vitality_index'] = (
    vitality['flow_density_index'] * 0.40 +
    vitality['social_activity_index'] * 0.25 +
    vitality['time_activity_index'] * 0.20 +
    vitality['weather_resilience_index'] * 0.15
).round(2)

# 活力等级
vitality['vitality_level'] = pd.cut(
    vitality['space_vitality_index'],
    bins=[0, 20, 40, 60, 80, 100],
    labels=['低', '较低', '中等', '较高', '高'],
    include_lowest=True
)

# 合并POI基础信息
vitality = vitality.merge(poi_df[['name', 'district', 'type', 'dist_to_center_km']],
                          left_on='poi_name', right_on='name', how='left')
vitality = vitality.drop(columns=['name'])

print("\n====== 空间活力指数排名 TOP 15 ======")
print(vitality.sort_values('space_vitality_index', ascending=False)[
    ['poi_name', 'district', 'type', 'flow_density_index', 'social_activity_index',
     'time_activity_index', 'weather_resilience_index', 'space_vitality_index', 'vitality_level']
].head(15).to_string(index=False))

print("\n====== 按区域平均活力 ======")
print(vitality.groupby('district')['space_vitality_index'].mean().sort_values(ascending=False).round(2))

print("\n====== 按类型平均活力 ======")
print(vitality.groupby('type')['space_vitality_index'].mean().sort_values(ascending=False).round(2))

# ====== 4. 写入MySQL ======
vitality.to_sql('poi_vitality_index', engine, if_exists='replace', index=False)
print(f"\n[OK] 空间活力指数已写入 poi_vitality_index 表 ({len(vitality)} 条)")

# 同时把逐日活力数据也算出来（给后面建模用）
# 逐日活力 = 人流密度得分(60%) + 时间因子(20%) + 天气因子(20%)
daily = heatmap_df[['date', 'poi_id', 'poi_name', 'district', 'poi_type',
                     'crowd_flow', 'flow_density_score',
                     'weather', 'weather_code', 'high_temp', 'low_temp',
                     'precipitation_mm', 'max_wind_speed_kmh',
                     'is_weekend', 'is_holiday', 'dist_to_center_km']].copy()

# 时间因子得分
daily['time_score'] = 50.0  # 工作日基础分
daily.loc[daily['is_weekend'] == 1, 'time_score'] = 70.0
daily.loc[daily['is_holiday'] == 1, 'time_score'] = 90.0

# 天气因子得分
weather_score_map = {0: 95, 1: 90, 2: 80, 3: 60, 45: 40, 48: 35,
                     51: 55, 53: 45, 55: 35, 61: 40, 63: 30, 65: 20,
                     80: 35, 81: 25, 82: 15, 95: 15}
daily['weather_score'] = daily['weather_code'].map(weather_score_map).fillna(50)

# 逐日综合活力
daily['daily_vitality'] = (
    daily['flow_density_score'] * 0.6 +
    daily['time_score'] * 0.2 +
    daily['weather_score'] * 0.2
).round(2)

daily.to_sql('daily_vitality', engine, if_exists='replace', index=False)
print(f"[OK] 逐日活力数据已写入 daily_vitality 表 ({len(daily)} 条)")

# ====== 5. 输出CSV ======
import os; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'output')
vitality.to_csv(f'{OUT}/poi_vitality_index.csv', index=False, encoding='utf-8-sig')
daily.head(1000).to_csv(f'{OUT}/daily_vitality_sample.csv', index=False, encoding='utf-8-sig')
print(f"[OK] 活力指数已输出 CSV: poi_vitality_index.csv")
print(f"[OK] 逐日活力样本已输出 CSV: daily_vitality_sample.csv")
print("\n[完成] 空间活力指标体系构建完毕!")
