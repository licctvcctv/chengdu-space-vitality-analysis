"""
成都城市公共休闲空间活力分析 - Flask后端
支持两种模式：MySQL模式 / CSV文件模式
"""
import os
import json
import pandas as pd
import numpy as np
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
STATIC_DIR = os.path.join(BASE_DIR, 'static')
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
OUTPUT_DIR = os.path.join(BASE_DIR, '..', 'output')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')
CORS(app)

# ====== 数据模式：mysql / csv ======
DATA_MODE = os.environ.get('DATA_MODE', 'mysql')
_engine = None
_csv_cache = {}


def get_engine():
    global _engine
    if _engine is None:
        from sqlalchemy import create_engine
        _engine = create_engine("mysql+pymysql://root:root@localhost/chengdu_space_vitality?charset=utf8mb4")
    return _engine


def query_df(sql, csv_fallback=None):
    """MySQL模式用SQL查询，CSV模式用本地文件"""
    if DATA_MODE == 'mysql':
        try:
            return pd.read_sql(sql, get_engine())
        except Exception as e:
            print(f"[MySQL失败] {e}，尝试CSV回退")
            if csv_fallback:
                return _load_csv(csv_fallback)
            raise
    else:
        if csv_fallback:
            return _load_csv(csv_fallback)
        raise ValueError(f"CSV模式下需要指定csv_fallback文件")


def _load_csv(name):
    """从output/或data/目录加载CSV"""
    if name in _csv_cache:
        return _csv_cache[name]
    for d in [OUTPUT_DIR, DATA_DIR]:
        path = os.path.join(d, name)
        if os.path.exists(path):
            df = pd.read_csv(path)
            _csv_cache[name] = df
            return df
    raise FileNotFoundError(f"找不到CSV: {name}")


# ====== 前端静态文件 ======
@app.route('/')
def index():
    return send_from_directory(DIST_DIR, 'index.html')


@app.route('/<path:path>')
def static_files(path):
    full = os.path.join(DIST_DIR, path)
    if os.path.exists(full):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')


# ====== API ======
@app.route('/api/overview')
def api_overview():
    if DATA_MODE == 'mysql':
        poi_count = query_df("SELECT COUNT(*) as c FROM poi_data").iloc[0]['c']
        total_flow = query_df("SELECT SUM(crowd_flow) as c FROM heatmap_data").iloc[0]['c']
        avg_vitality = query_df("SELECT AVG(space_vitality_index) as c FROM poi_vitality_index").iloc[0]['c']
        weibo_count = query_df("SELECT COUNT(*) as c FROM weibo_checkin").iloc[0]['c']
        xhs_count = query_df("SELECT COUNT(*) as c FROM xhs_checkin").iloc[0]['c']
        weather_days = query_df("SELECT COUNT(*) as c FROM weather_data").iloc[0]['c']
    else:
        poi_df = _load_csv('poi_data_cleaned.csv')
        heatmap_df = _load_csv('chengdu_heatmap.csv')
        weibo_df = _load_csv('weibo_checkin.csv')
        xhs_df = _load_csv('xhs_checkin_full.csv')
        weather_df = _load_csv('chengdu_weather.csv')
        poi_count = len(poi_df)
        total_flow = int(heatmap_df['crowd_flow'].sum())
        try:
            vitality_df = _load_csv('poi_vitality_index.csv')
            avg_vitality = vitality_df['space_vitality_index'].mean()
        except FileNotFoundError:
            avg_vitality = 30.0  # 默认值，需先运行脚本2
        weibo_count = len(weibo_df)
        xhs_count = len(xhs_df)
        weather_days = len(weather_df)

    return jsonify({
        'poi_count': int(poi_count),
        'total_flow': int(total_flow),
        'avg_vitality': round(float(avg_vitality), 1),
        'social_posts': int(weibo_count + xhs_count),
        'weather_days': int(weather_days),
    })


@app.route('/api/vitality_ranking')
def api_vitality_ranking():
    if DATA_MODE == 'mysql':
        df = query_df("""
            SELECT poi_name, district, type, space_vitality_index,
                   flow_density_index, social_activity_index,
                   time_activity_index, weather_resilience_index, vitality_level
            FROM poi_vitality_index ORDER BY space_vitality_index DESC LIMIT 15
        """)
    else:
        try:
            df = _load_csv('poi_vitality_index.csv').sort_values('space_vitality_index', ascending=False).head(15)
        except FileNotFoundError:
            return jsonify({'names':[],'scores':[],'districts':[],'levels':[],'details':[]})
    return jsonify({
        'names': df['poi_name'].tolist(),
        'scores': df['space_vitality_index'].tolist(),
        'districts': df['district'].tolist(),
        'levels': df['vitality_level'].tolist(),
        'details': df.to_dict('records'),
    })


@app.route('/api/district_flow')
def api_district_flow():
    df = query_df("SELECT * FROM stat_district_impact ORDER BY avg_flow DESC",
                  csv_fallback='stat_district_impact.csv')
    return jsonify({
        'districts': df['district'].tolist(),
        'avg_flow': df['avg_flow'].tolist(),
        'poi_count': df['poi_count'].tolist(),
    })


@app.route('/api/weather_impact')
def api_weather_impact():
    df = query_df("SELECT * FROM stat_weather_impact ORDER BY avg_flow DESC",
                  csv_fallback='stat_weather_impact.csv')
    return jsonify({
        'weather_types': df['weather'].tolist(),
        'avg_flow': df['avg_flow'].tolist(),
    })


@app.route('/api/season_impact')
def api_season_impact():
    df = query_df("SELECT * FROM stat_season_impact", csv_fallback='stat_season_impact.csv')
    order = ['春季', '夏季', '秋季', '冬季']
    df['sort_key'] = df['season'].map({s: i for i, s in enumerate(order)})
    df = df.sort_values('sort_key')
    return jsonify({
        'seasons': df['season'].tolist(),
        'avg_flow': df['avg_flow'].tolist(),
    })


@app.route('/api/model_comparison')
def api_model_comparison():
    df = query_df("SELECT * FROM model_comparison", csv_fallback='model_comparison.csv')
    return jsonify(df.to_dict('records'))


@app.route('/api/feature_importance')
def api_feature_importance():
    df = query_df("SELECT * FROM feature_importance ORDER BY importance DESC LIMIT 10",
                  csv_fallback='feature_importance.csv')
    if DATA_MODE != 'mysql':
        df = df.sort_values('importance', ascending=False).head(10)
    return jsonify({
        'features': df['feature_cn'].tolist(),
        'importance': [round(x, 4) for x in df['importance'].tolist()],
    })


@app.route('/api/monthly_trend')
def api_monthly_trend():
    if DATA_MODE == 'mysql':
        df = query_df("""
            SELECT DATE_FORMAT(date, '%%Y-%%m') as month,
                   AVG(crowd_flow) as avg_flow
            FROM heatmap_data
            GROUP BY DATE_FORMAT(date, '%%Y-%%m') ORDER BY month
        """)
    else:
        hm = _load_csv('chengdu_heatmap.csv')
        hm['date'] = pd.to_datetime(hm['date'])
        hm['month'] = hm['date'].dt.to_period('M').astype(str)
        df = hm.groupby('month')['crowd_flow'].mean().reset_index()
        df.columns = ['month', 'avg_flow']
    return jsonify({
        'months': df['month'].tolist(),
        'avg_flow': [round(x, 0) for x in df['avg_flow'].tolist()],
    })


@app.route('/api/poi_map')
def api_poi_map():
    if DATA_MODE == 'mysql':
        df = query_df("""
            SELECT p.name, p.lon, p.lat, p.district, p.type,
                   v.space_vitality_index, v.vitality_level
            FROM poi_data p LEFT JOIN poi_vitality_index v ON p.name = v.poi_name
        """)
    else:
        poi = _load_csv('poi_data_cleaned.csv')
        vit = _load_csv('poi_vitality_index.csv')
        df = poi.merge(vit[['poi_name', 'space_vitality_index', 'vitality_level']],
                       left_on='name', right_on='poi_name', how='left')
    points = []
    for _, row in df.iterrows():
        points.append({
            'name': row['name'],
            'value': [round(row['lon'], 6), round(row['lat'], 6),
                      round(row.get('space_vitality_index') or 0, 1)],
            'district': row['district'],
            'type': row['type'],
            'level': row.get('vitality_level') or '未知',
        })
    return jsonify(points)


@app.route('/api/time_pattern')
def api_time_pattern():
    if DATA_MODE == 'mysql':
        df = query_df("""
            SELECT poi_type,
                   AVG(CASE WHEN is_weekend=0 AND is_holiday=0 THEN crowd_flow END) as workday_avg,
                   AVG(CASE WHEN is_weekend=1 AND is_holiday=0 THEN crowd_flow END) as weekend_avg,
                   AVG(CASE WHEN is_holiday=1 THEN crowd_flow END) as holiday_avg
            FROM heatmap_data GROUP BY poi_type ORDER BY workday_avg DESC
        """)
    else:
        hm = _load_csv('chengdu_heatmap.csv')
        workday = hm[(hm['is_weekend']==0)&(hm['is_holiday']==0)].groupby('poi_type')['crowd_flow'].mean()
        weekend = hm[(hm['is_weekend']==1)&(hm['is_holiday']==0)].groupby('poi_type')['crowd_flow'].mean()
        holiday = hm[hm['is_holiday']==1].groupby('poi_type')['crowd_flow'].mean()
        df = pd.DataFrame({'poi_type': workday.index, 'workday_avg': workday.values,
                           'weekend_avg': weekend.values, 'holiday_avg': holiday.values})
        df = df.sort_values('workday_avg', ascending=False)
    return jsonify({
        'types': df['poi_type'].tolist(),
        'workday': [round(x, 0) for x in df['workday_avg'].tolist()],
        'weekend': [round(x, 0) for x in df['weekend_avg'].tolist()],
        'holiday': [round(x, 0) for x in df['holiday_avg'].tolist()],
    })


@app.route('/api/findings')
def api_findings():
    df = query_df("SELECT * FROM analysis_findings", csv_fallback='analysis_findings.csv')
    return jsonify(df.to_dict('records'))


@app.route('/api/lstm_results')
def api_lstm_results():
    df = query_df("SELECT * FROM lstm_results", csv_fallback='lstm_results.csv')
    return jsonify(df.to_dict('records'))


@app.route('/api/chengdu_geo')
def api_chengdu_geo():
    geo_path = os.path.join(STATIC_DIR, 'chengdu.json')
    with open(geo_path, 'r') as f:
        return jsonify(json.load(f))


def start(port=5001, mode='mysql'):
    global DATA_MODE
    DATA_MODE = mode
    print(f"\n{'='*50}")
    print(f"  成都城市公共休闲空间活力分析系统")
    print(f"  数据模式: {'MySQL数据库' if mode == 'mysql' else 'CSV文件(无需MySQL)'}")
    print(f"  访问地址: http://127.0.0.1:{port}")
    print(f"{'='*50}\n")
    app.run(host='127.0.0.1', port=port, debug=False)


if __name__ == '__main__':
    start()
