"""
成都城市公共休闲空间活力分析 - MySQL建库建表 + 数据导入
"""
import pymysql
import pandas as pd
from sqlalchemy import create_engine

DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = 'root'
DB_NAME = 'chengdu_space_vitality'
import os
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

# ====== 1. 建库 ======
conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, charset='utf8mb4')
cursor = conn.cursor()
cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
conn.close()
print(f"[OK] 数据库 {DB_NAME} 已创建")

# ====== 2. 建表 ======
conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME, charset='utf8mb4')
cursor = conn.cursor()

tables_sql = [
    # POI数据表
    """
    CREATE TABLE IF NOT EXISTS poi_data (
        id VARCHAR(20) PRIMARY KEY COMMENT '高德POI唯一ID',
        name VARCHAR(100) NOT NULL COMMENT '地点名称',
        lon DOUBLE COMMENT '经度',
        lat DOUBLE COMMENT '纬度',
        address VARCHAR(255) COMMENT '详细地址',
        province VARCHAR(20) COMMENT '省',
        city VARCHAR(20) COMMENT '市',
        district VARCHAR(20) COMMENT '区',
        type VARCHAR(20) COMMENT '类型：景区/广场/公园',
        dist_to_center_km DOUBLE COMMENT '距天府广场距离(km)',
        base_flow DOUBLE COMMENT '基础日人流量',
        INDEX idx_district (district),
        INDEX idx_type (type)
    ) ENGINE=InnoDB COMMENT='高德POI数据'
    """,
    # 天气数据表
    """
    CREATE TABLE IF NOT EXISTS weather_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL COMMENT '日期',
        high_temp FLOAT COMMENT '最高温度',
        low_temp FLOAT COMMENT '最低温度',
        weather VARCHAR(20) COMMENT '天气描述',
        weather_code INT COMMENT 'WMO天气代码',
        precipitation_mm FLOAT COMMENT '日降水量(mm)',
        max_wind_speed_kmh FLOAT COMMENT '最大风速(km/h)',
        wind_direction_deg FLOAT COMMENT '风向(度)',
        is_weekend TINYINT COMMENT '是否周末',
        is_holiday TINYINT COMMENT '是否节假日',
        UNIQUE KEY uk_date (date),
        INDEX idx_weather (weather_code)
    ) ENGINE=InnoDB COMMENT='天气数据'
    """,
    # 人流热力数据表
    """
    CREATE TABLE IF NOT EXISTS heatmap_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        poi_id VARCHAR(20) NOT NULL,
        poi_name VARCHAR(100),
        district VARCHAR(20),
        lon DOUBLE,
        lat DOUBLE,
        poi_type VARCHAR(20),
        dist_to_center_km DOUBLE,
        crowd_flow INT COMMENT '日人流量(人次)',
        weather VARCHAR(20),
        weather_code INT,
        high_temp FLOAT,
        low_temp FLOAT,
        precipitation_mm FLOAT,
        max_wind_speed_kmh FLOAT,
        is_weekend TINYINT,
        is_holiday TINYINT,
        INDEX idx_date (date),
        INDEX idx_poi (poi_id),
        INDEX idx_district (district),
        INDEX idx_date_poi (date, poi_id)
    ) ENGINE=InnoDB COMMENT='人流热力数据'
    """,
    # 微博打卡数据表
    """
    CREATE TABLE IF NOT EXISTS weibo_checkin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_date DATE COMMENT '发帖日期',
        poi_name VARCHAR(100),
        poi_id VARCHAR(20),
        district VARCHAR(20),
        poi_type VARCHAR(20),
        lon DOUBLE,
        lat DOUBLE,
        user VARCHAR(100) COMMENT '用户昵称',
        content TEXT COMMENT '帖子内容',
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        reposts_count INT DEFAULT 0,
        social_activity_score FLOAT COMMENT '社交活跃度',
        INDEX idx_poi (poi_name),
        INDEX idx_date (post_date)
    ) ENGINE=InnoDB COMMENT='微博打卡数据'
    """,
    # 小红书笔记数据表
    """
    CREATE TABLE IF NOT EXISTS xhs_checkin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id VARCHAR(50) COMMENT '笔记ID',
        type VARCHAR(20) COMMENT '类型(video/normal)',
        title VARCHAR(255) COMMENT '标题',
        `desc` TEXT COMMENT '描述',
        time BIGINT COMMENT '发布时间戳',
        nickname VARCHAR(100) COMMENT '作者昵称',
        liked_count VARCHAR(20),
        collected_count VARCHAR(20),
        comment_count VARCHAR(20),
        share_count VARCHAR(20),
        ip_location VARCHAR(50) COMMENT 'IP属地',
        tag_list TEXT COMMENT '标签列表',
        source_keyword VARCHAR(100) COMMENT '搜索关键词',
        INDEX idx_keyword (source_keyword)
    ) ENGINE=InnoDB COMMENT='小红书笔记数据'
    """,
    # 小红书评论数据表
    """
    CREATE TABLE IF NOT EXISTS xhs_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id VARCHAR(50),
        create_time BIGINT COMMENT '评论时间戳',
        ip_location VARCHAR(50),
        note_id VARCHAR(50),
        content TEXT COMMENT '评论内容',
        nickname VARCHAR(100),
        sub_comment_count INT DEFAULT 0,
        parent_comment_id VARCHAR(50),
        like_count VARCHAR(20),
        INDEX idx_note (note_id)
    ) ENGINE=InnoDB COMMENT='小红书评论数据'
    """,
]

for sql in tables_sql:
    cursor.execute(sql)
conn.commit()
conn.close()
print("[OK] 所有表已创建")

# ====== 3. 导入数据 ======
engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}?charset=utf8mb4")

# 3.1 POI数据
print("\n导入 POI 数据...")
poi_df = pd.read_csv(f"{DATA_DIR}/poi_data_cleaned.csv")
# 去掉序号列
if '#' in poi_df.columns:
    poi_df = poi_df.drop(columns=['#'])
poi_df.to_sql('poi_data', engine, if_exists='replace', index=False)
print(f"  -> {len(poi_df)} 条")

# 3.2 天气数据
print("导入天气数据...")
weather_df = pd.read_csv(f"{DATA_DIR}/chengdu_weather.csv")
weather_df.to_sql('weather_data', engine, if_exists='replace', index=False)
print(f"  -> {len(weather_df)} 条")

# 3.3 热力数据(较大，分批导入)
print("导入热力数据（约4.5万条）...")
heatmap_df = pd.read_csv(f"{DATA_DIR}/chengdu_heatmap.csv")
heatmap_df.to_sql('heatmap_data', engine, if_exists='replace', index=False, chunksize=5000)
print(f"  -> {len(heatmap_df)} 条")

# 3.4 微博打卡
print("导入微博打卡数据...")
weibo_df = pd.read_csv(f"{DATA_DIR}/weibo_checkin.csv")
weibo_df.to_sql('weibo_checkin', engine, if_exists='replace', index=False)
print(f"  -> {len(weibo_df)} 条")

# 3.5 小红书笔记
print("导入小红书笔记数据...")
xhs_df = pd.read_csv(f"{DATA_DIR}/xhs_checkin_full.csv")
xhs_df.to_sql('xhs_checkin', engine, if_exists='replace', index=False)
print(f"  -> {len(xhs_df)} 条")

# 3.6 小红书评论
print("导入小红书评论数据...")
xhs_comments_df = pd.read_csv(f"{DATA_DIR}/xhs_comments.csv")
xhs_comments_df.to_sql('xhs_comments', engine, if_exists='replace', index=False)
print(f"  -> {len(xhs_comments_df)} 条")

# ====== 4. 验证 ======
print("\n====== 数据验证 ======")
with engine.connect() as conn:
    from sqlalchemy import text
    tables = ['poi_data', 'weather_data', 'heatmap_data', 'weibo_checkin', 'xhs_checkin', 'xhs_comments']
    for t in tables:
        result = conn.execute(text(f"SELECT COUNT(*) FROM {t}"))
        count = result.scalar()
        print(f"  {t}: {count} 条")

print("\n[完成] 所有数据已导入MySQL!")
