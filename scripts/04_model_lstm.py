"""
LSTM 时间序列预测模型 - 预测POI人流量趋势
参考 TrafficFlowPrediction 项目的结构
"""
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sqlalchemy import create_engine
import warnings
warnings.filterwarnings('ignore')

engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")

# ====== 1. 数据准备 ======
df = pd.read_sql("SELECT * FROM heatmap_data ORDER BY date, poi_id", engine)
df['date'] = pd.to_datetime(df['date'])

# 选择人流量最大的TOP10 POI做LSTM（全部POI太慢）
top_pois = df.groupby('poi_name')['crowd_flow'].mean().nlargest(10).index.tolist()
print(f"选择TOP10 POI: {top_pois}")

# ====== 2. LSTM 模型定义 ======
class LSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size=64, num_layers=2, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers,
                           batch_first=True, dropout=dropout)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # 取最后一个时间步
        return out

# ====== 3. 数据构造：滑动窗口 ======
def create_sequences(data, seq_len=30):
    """用前seq_len天预测下一天"""
    X, y = [], []
    for i in range(len(data) - seq_len):
        X.append(data[i:i+seq_len])
        y.append(data[i+seq_len, 0])  # 预测crowd_flow
    return np.array(X), np.array(y)

# ====== 4. 特征列 ======
feature_cols = ['crowd_flow', 'weather_code', 'high_temp', 'low_temp',
                'precipitation_mm', 'max_wind_speed_kmh', 'is_weekend', 'is_holiday']

SEQ_LEN = 30  # 用前30天预测
EPOCHS = 50
BATCH_SIZE = 32
DEVICE = 'cpu'

# ====== 5. 逐POI训练 ======
all_results = []
all_predictions = []

for poi_name in top_pois:
    print(f"\n{'='*50}")
    print(f"训练POI: {poi_name}")
    print(f"{'='*50}")

    poi_df = df[df['poi_name'] == poi_name].sort_values('date').reset_index(drop=True)
    data = poi_df[feature_cols].values.astype(np.float32)

    # 归一化
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(data)

    # 构造序列
    X, y = create_sequences(data_scaled, SEQ_LEN)

    # 划分训练/测试集 (最后60天测试)
    test_size = 60
    X_train, X_test = X[:-test_size], X[-test_size:]
    y_train, y_test = y[:-test_size], y[-test_size:]

    # 转为Tensor
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train).unsqueeze(1)
    X_test_t = torch.FloatTensor(X_test)
    y_test_t = torch.FloatTensor(y_test).unsqueeze(1)

    train_dataset = TensorDataset(X_train_t, y_train_t)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)

    # 模型
    model = LSTMModel(input_size=len(feature_cols), hidden_size=64, num_layers=2)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.5)

    # 训练
    model.train()
    for epoch in range(EPOCHS):
        total_loss = 0
        for xb, yb in train_loader:
            pred = model(xb)
            loss = criterion(pred, yb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        scheduler.step()
        if (epoch + 1) % 10 == 0:
            avg_loss = total_loss / len(train_loader)
            print(f"  Epoch {epoch+1}/{EPOCHS}, Loss: {avg_loss:.6f}")

    # 预测
    model.eval()
    with torch.no_grad():
        y_pred_scaled = model(X_test_t).numpy().flatten()

    # 反归一化: 只需反归一化crowd_flow列(第0列)
    # 构造完整矩阵做反归一化
    y_test_full = np.zeros((len(y_test), len(feature_cols)))
    y_test_full[:, 0] = y_test
    y_pred_full = np.zeros((len(y_pred_scaled), len(feature_cols)))
    y_pred_full[:, 0] = y_pred_scaled

    y_test_real = scaler.inverse_transform(y_test_full)[:, 0]
    y_pred_real = scaler.inverse_transform(y_pred_full)[:, 0]

    # 评估
    rmse = np.sqrt(mean_squared_error(y_test_real, y_pred_real))
    mae = mean_absolute_error(y_test_real, y_pred_real)
    r2 = r2_score(y_test_real, y_pred_real)
    mape = np.mean(np.abs((y_test_real - y_pred_real) / (y_test_real + 1))) * 100

    result = {'POI': poi_name, 'RMSE': round(rmse, 2), 'MAE': round(mae, 2),
              'R²': round(r2, 4), 'MAPE(%)': round(mape, 2)}
    all_results.append(result)
    print(f"  结果: RMSE={rmse:.2f}, MAE={mae:.2f}, R²={r2:.4f}, MAPE={mape:.2f}%")

    # 保存预测
    test_dates = poi_df['date'].values[-test_size - SEQ_LEN:][-test_size:]
    for i in range(len(y_test_real)):
        all_predictions.append({
            'date': str(test_dates[i])[:10],
            'poi_name': poi_name,
            'actual': int(y_test_real[i]),
            'lstm_predicted': int(y_pred_real[i]),
        })

# ====== 6. 汇总结果 ======
results_df = pd.DataFrame(all_results)
print("\n" + "="*70)
print("LSTM 预测结果汇总")
print("="*70)
print(results_df.to_string(index=False))
print(f"\n平均 RMSE: {results_df['RMSE'].mean():.2f}")
print(f"平均 MAE: {results_df['MAE'].mean():.2f}")
print(f"平均 R²: {results_df['R²'].mean():.4f}")
print(f"平均 MAPE: {results_df['MAPE(%)'].mean():.2f}%")

# ====== 7. 写入MySQL ======
results_df.to_sql('lstm_results', engine, if_exists='replace', index=False)
pred_df = pd.DataFrame(all_predictions)
pred_df.to_sql('lstm_predictions', engine, if_exists='replace', index=False)

# ====== 8. 输出CSV ======
import os; OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'output')
results_df.to_csv(f'{OUT}/lstm_results.csv', index=False, encoding='utf-8-sig')
pred_df.to_csv(f'{OUT}/lstm_predictions.csv', index=False, encoding='utf-8-sig')

print(f"\n[OK] LSTM结果已写入 lstm_results 表 + CSV")
print(f"[OK] LSTM预测已写入 lstm_predictions 表 + CSV ({len(pred_df)} 条)")
print("\n[完成] LSTM 建模完毕!")
