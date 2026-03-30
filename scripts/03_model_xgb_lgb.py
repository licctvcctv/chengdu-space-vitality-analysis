"""
XGBoost / LightGBM 回归模型 - 预测空间活力(crowd_flow)
含4组对照实验 + 特征重要性分析
"""
import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
from sqlalchemy import create_engine
import json
import warnings
warnings.filterwarnings('ignore')

engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")

# ====== 1. 读取数据 ======
df = pd.read_sql("SELECT * FROM heatmap_data", engine)
print(f"数据量: {len(df)} 条")

# ====== 2. 特征工程 ======
df['date'] = pd.to_datetime(df['date'])
df['month'] = df['date'].dt.month
df['day_of_week'] = df['date'].dt.dayofweek
df['day_of_year'] = df['date'].dt.dayofyear
df['quarter'] = df['date'].dt.quarter

# 温度特征
df['avg_temp'] = (df['high_temp'] + df['low_temp']) / 2
df['temp_range'] = df['high_temp'] - df['low_temp']

# 舒适度
df['comfort'] = df['avg_temp'].apply(lambda t: 1.1 if 15<=t<=25 else (1.0 if 10<=t<=30 else 0.7))

# 编码分类变量
le_district = LabelEncoder()
le_type = LabelEncoder()
df['district_enc'] = le_district.fit_transform(df['district'])
df['poi_type_enc'] = le_type.fit_transform(df['poi_type'])

# 目标变量
target = 'crowd_flow'

# ====== 3. 定义4组对照实验的特征集 ======
# 实验1: 仅基础特征(地理+时间)
feat_base = ['dist_to_center_km', 'district_enc', 'poi_type_enc',
             'month', 'day_of_week', 'day_of_year', 'quarter',
             'is_weekend', 'is_holiday']

# 实验2: 基础 + 天气
feat_weather = feat_base + ['weather_code', 'high_temp', 'low_temp', 'avg_temp',
                            'temp_range', 'precipitation_mm', 'max_wind_speed_kmh', 'comfort']

# 实验3: 基础 + 社交(用POI编码代替，因为社交数据是POI级别的)
feat_social = feat_base + ['district_enc', 'poi_type_enc']
# 加入POI级别的社交活跃度
poi_vitality = pd.read_sql("SELECT poi_name, social_activity_index FROM poi_vitality_index", engine)
df = df.merge(poi_vitality, on='poi_name', how='left')
df['social_activity_index'] = df['social_activity_index'].fillna(10.0)
feat_social = feat_base + ['social_activity_index']

# 实验4: 全部特征
feat_all = feat_weather + ['social_activity_index']

experiments = {
    '实验1-仅基础特征': feat_base,
    '实验2-基础+天气': feat_weather,
    '实验3-基础+社交': feat_social,
    '实验4-全部特征': feat_all,
}

# ====== 4. 训练和评估 ======
def evaluate(y_true, y_pred, name):
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / (y_true + 1))) * 100
    return {'模型': name, 'RMSE': round(rmse, 2), 'MAE': round(mae, 2),
            'R²': round(r2, 4), 'MAPE(%)': round(mape, 2)}

# 按时间划分: 最后60天做测试集
df = df.sort_values('date')
split_date = df['date'].max() - pd.Timedelta(days=60)
train_df = df[df['date'] <= split_date]
test_df = df[df['date'] > split_date]
print(f"训练集: {len(train_df)}, 测试集: {len(test_df)}")
print(f"训练期: {train_df['date'].min()} ~ {train_df['date'].max()}")
print(f"测试期: {test_df['date'].min()} ~ {test_df['date'].max()}")

results = []

for exp_name, features in experiments.items():
    # 去重特征
    features = list(dict.fromkeys(features))
    X_train = train_df[features].values
    y_train = train_df[target].values
    X_test = test_df[features].values
    y_test = test_df[target].values

    # XGBoost
    xgb_model = xgb.XGBRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        verbosity=0
    )
    xgb_model.fit(X_train, y_train)
    xgb_pred = xgb_model.predict(X_test)
    results.append(evaluate(y_test, xgb_pred, f'XGBoost-{exp_name}'))

    # LightGBM
    lgb_model = lgb.LGBMRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
        verbose=-1
    )
    lgb_model.fit(X_train, y_train)
    lgb_pred = lgb_model.predict(X_test)
    results.append(evaluate(y_test, lgb_pred, f'LightGBM-{exp_name}'))

# ====== 5. 结果对比 ======
results_df = pd.DataFrame(results)
print("\n" + "="*80)
print("对照实验结果")
print("="*80)
print(results_df.to_string(index=False))

# ====== 6. 最佳模型的特征重要性分析 ======
print("\n" + "="*80)
print("特征重要性分析 (XGBoost - 全部特征)")
print("="*80)

features_all = list(dict.fromkeys(feat_all))
xgb_best = xgb.XGBRegressor(
    n_estimators=300, max_depth=6, learning_rate=0.1,
    subsample=0.8, colsample_bytree=0.8, random_state=42, verbosity=0
)
xgb_best.fit(train_df[features_all].values, train_df[target].values)

feature_names_cn = {
    'dist_to_center_km': '距市中心距离',
    'district_enc': '所在区域',
    'poi_type_enc': 'POI类型',
    'month': '月份',
    'day_of_week': '星期',
    'day_of_year': '年内天数',
    'quarter': '季度',
    'is_weekend': '是否周末',
    'is_holiday': '是否节假日',
    'weather_code': '天气代码',
    'high_temp': '最高温度',
    'low_temp': '最低温度',
    'avg_temp': '平均温度',
    'temp_range': '温差',
    'precipitation_mm': '降水量',
    'max_wind_speed_kmh': '最大风速',
    'comfort': '舒适度',
    'social_activity_index': '社交活跃度',
}

importance = pd.DataFrame({
    'feature': features_all,
    'feature_cn': [feature_names_cn.get(f, f) for f in features_all],
    'importance': xgb_best.feature_importances_
}).sort_values('importance', ascending=False)

print(importance[['feature_cn', 'importance']].to_string(index=False))

# ====== 7. 保存结果到MySQL ======
results_df.to_sql('model_comparison', engine, if_exists='replace', index=False)
importance.to_sql('feature_importance', engine, if_exists='replace', index=False)

# 保存最佳模型预测结果
best_pred_df = test_df[['date', 'poi_name', 'district', 'poi_type', 'crowd_flow']].copy()
best_pred_df['xgb_predicted'] = xgb_best.predict(test_df[features_all].values).round(0).astype(int)

lgb_best = lgb.LGBMRegressor(
    n_estimators=300, max_depth=6, learning_rate=0.1,
    subsample=0.8, colsample_bytree=0.8, random_state=42, verbose=-1
)
lgb_best.fit(train_df[features_all].values, train_df[target].values)
best_pred_df['lgb_predicted'] = lgb_best.predict(test_df[features_all].values).round(0).astype(int)
best_pred_df.to_sql('model_predictions', engine, if_exists='replace', index=False)

# ====== 8. 输出CSV数据文件 ======
import os; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'output')
results_df.to_csv(f'{OUT}/model_comparison.csv', index=False, encoding='utf-8-sig')
importance.to_csv(f'{OUT}/feature_importance.csv', index=False, encoding='utf-8-sig')
best_pred_df.to_csv(f'{OUT}/xgb_lgb_predictions.csv', index=False, encoding='utf-8-sig')

print(f"\n[OK] 模型对比结果已写入 model_comparison 表 + CSV")
print(f"[OK] 特征重要性已写入 feature_importance 表 + CSV")
print(f"[OK] 预测结果已写入 model_predictions 表 + CSV ({len(best_pred_df)} 条)")
print("\n[完成] XGBoost/LightGBM 建模完毕!")
