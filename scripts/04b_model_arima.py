"""
ARIMA 时间序列预测模型 - 预测POI日人流量趋势
与LSTM形成对照实验，验证传统统计模型 vs 深度学习模型的效果差异
"""
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sqlalchemy import create_engine
import warnings
warnings.filterwarnings('ignore')

engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")
import os as _os; OUT = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'output')

# ====== 1. 数据准备 ======
print("="*60)
print("ARIMA 时间序列预测模型")
print("="*60)

df = pd.read_sql("SELECT * FROM heatmap_data ORDER BY date, poi_id", engine)
df['date'] = pd.to_datetime(df['date'])

# 选择与LSTM相同的TOP10 POI
top_pois = df.groupby('poi_name')['crowd_flow'].mean().nlargest(10).index.tolist()
print(f"选择TOP10 POI: {top_pois}")

# ====== 2. 逐POI训练ARIMA ======
TEST_SIZE = 60  # 最后60天做测试
all_results = []
all_predictions = []

for poi_name in top_pois:
    print(f"\n{'='*50}")
    print(f"训练POI: {poi_name}")

    poi_df = df[df['poi_name'] == poi_name].sort_values('date').reset_index(drop=True)
    ts = poi_df['crowd_flow'].values.astype(float)

    train = ts[:-TEST_SIZE]
    test = ts[-TEST_SIZE:]
    test_dates = poi_df['date'].values[-TEST_SIZE:]

    # ARIMA(5,1,2) - 经验参数，适合日度数据
    try:
        model = ARIMA(train, order=(5, 1, 2))
        fitted = model.fit()

        # 滚动预测（更贴近实际应用）
        predictions = []
        history = list(train)
        for t in range(TEST_SIZE):
            model_step = ARIMA(history, order=(5, 1, 2))
            model_fit = model_step.fit()
            yhat = model_fit.forecast(steps=1)[0]
            predictions.append(max(50, yhat))  # 最小50人
            history.append(test[t])

        predictions = np.array(predictions)

        # 评估
        rmse = np.sqrt(mean_squared_error(test, predictions))
        mae = mean_absolute_error(test, predictions)
        r2 = r2_score(test, predictions)
        mape = np.mean(np.abs((test - predictions) / (test + 1))) * 100

        result = {'POI': poi_name, 'Model': 'ARIMA(5,1,2)',
                  'RMSE': round(rmse, 2), 'MAE': round(mae, 2),
                  'R²': round(r2, 4), 'MAPE(%)': round(mape, 2)}
        all_results.append(result)
        print(f"  RMSE={rmse:.2f}, MAE={mae:.2f}, R²={r2:.4f}, MAPE={mape:.2f}%")

        for i in range(len(test)):
            all_predictions.append({
                'date': str(test_dates[i])[:10],
                'poi_name': poi_name,
                'actual': int(test[i]),
                'arima_predicted': int(predictions[i]),
            })
    except Exception as e:
        print(f"  ARIMA失败: {e}")
        all_results.append({'POI': poi_name, 'Model': 'ARIMA(5,1,2)',
                           'RMSE': 0, 'MAE': 0, 'R²': 0, 'MAPE(%)': 0})

# ====== 3. 汇总结果 ======
results_df = pd.DataFrame(all_results)
print("\n" + "="*70)
print("ARIMA 预测结果汇总")
print("="*70)
print(results_df.to_string(index=False))
print(f"\n平均 RMSE: {results_df['RMSE'].mean():.2f}")
print(f"平均 MAE: {results_df['MAE'].mean():.2f}")
print(f"平均 R²: {results_df['R²'].mean():.4f}")
print(f"平均 MAPE: {results_df['MAPE(%)'].mean():.2f}%")

# ====== 4. 与LSTM对比 ======
lstm_df = pd.read_sql("SELECT * FROM lstm_results", engine)
print("\n" + "="*70)
print("ARIMA vs LSTM 对比")
print("="*70)
compare = results_df[['POI', 'RMSE', 'MAE', 'R²']].rename(
    columns={'RMSE': 'ARIMA_RMSE', 'MAE': 'ARIMA_MAE', 'R²': 'ARIMA_R²'})
compare = compare.merge(
    lstm_df[['POI', 'RMSE', 'MAE', 'R²']].rename(
        columns={'RMSE': 'LSTM_RMSE', 'MAE': 'LSTM_MAE', 'R²': 'LSTM_R²'}),
    on='POI', how='left')
print(compare.to_string(index=False))

# ====== 5. 写入MySQL + CSV ======
results_df.to_sql('arima_results', engine, if_exists='replace', index=False)
pred_df = pd.DataFrame(all_predictions)
pred_df.to_sql('arima_predictions', engine, if_exists='replace', index=False)
compare.to_sql('arima_vs_lstm', engine, if_exists='replace', index=False)

# 输出CSV
results_df.to_csv(f'{OUT}/arima_results.csv', index=False, encoding='utf-8-sig')
pred_df.to_csv(f'{OUT}/arima_predictions.csv', index=False, encoding='utf-8-sig')
compare.to_csv(f'{OUT}/arima_vs_lstm_compare.csv', index=False, encoding='utf-8-sig')

print(f"\n[OK] ARIMA结果已写入 arima_results 表 + CSV")
print(f"[OK] ARIMA预测已写入 arima_predictions 表 ({len(pred_df)} 条)")
print(f"[OK] ARIMA vs LSTM对比已写入 arima_vs_lstm 表 + CSV")
print("\n[完成] ARIMA 建模完毕!")
