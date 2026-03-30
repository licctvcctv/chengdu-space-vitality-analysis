#!/usr/bin/env python3
"""
成都城市公共休闲空间活力分析系统 - 主入口
直接运行: python main.py
"""
import os
import sys
import subprocess
import signal

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(PROJECT_DIR, 'scripts')
OUTPUT_DIR = os.path.join(PROJECT_DIR, 'output')
FIGURES_DIR = os.path.join(OUTPUT_DIR, 'figures')

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FIGURES_DIR, exist_ok=True)

# ====== 找到正确的 Python（优先系统 3.9，依赖装在这里） ======
def find_python():
    candidates = [
        '/usr/bin/python3',
        '/Library/Developer/CommandLineTools/usr/bin/python3',
        sys.executable,
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                r = subprocess.run([p, '-c', 'import pandas; import flask; print("ok")'],
                                   capture_output=True, text=True, timeout=10)
                if r.returncode == 0:
                    return p
            except Exception:
                continue
    return sys.executable

PYTHON = find_python()


def kill_port(port):
    """清理指定端口的进程"""
    try:
        result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
        pids = result.stdout.strip().split('\n')
        for pid in pids:
            if pid.strip():
                try:
                    os.kill(int(pid.strip()), signal.SIGKILL)
                except (ProcessLookupError, ValueError):
                    pass
        if any(p.strip() for p in pids):
            import time
            time.sleep(1)
            print(f"  已清理端口 {port}")
    except Exception:
        pass


def banner():
    print("\n" + "=" * 58)
    print("   成都城市公共休闲空间活力分析系统")
    print("   Chengdu Urban Public Space Vitality Analysis")
    print("=" * 58)
    print(f"  Python: {PYTHON}")


def menu():
    print("\n  [1] 数据清洗与导入 (MySQL建库建表 + 活力指标构建)")
    print("  [2] 数据分析 (关键因素分析 + 统计输出)")
    print("  [3] 模型训练 (XGBoost/LightGBM + LSTM + ARIMA + 出图)")
    print("  [4] 启动可视化大屏 (Flask + 静态前端)")
    print("  [5] 一键全部执行 (1→2→3)")
    print("  [0] 退出")
    print()


def run_script(name, desc):
    path = os.path.join(SCRIPTS_DIR, name)
    print(f"\n{'─'*50}")
    print(f"  ▶ {desc}")
    print(f"    脚本: {name}")
    print(f"{'─'*50}")
    env = os.environ.copy()
    # XGBoost needs libomp on macOS
    homebrew_lib = os.path.expanduser('~/.homebrew/opt/libomp/lib')
    if os.path.exists(homebrew_lib):
        env['DYLD_LIBRARY_PATH'] = homebrew_lib
    result = subprocess.run([PYTHON, path], cwd=PROJECT_DIR, env=env)
    if result.returncode != 0:
        print(f"  ✗ {name} 执行失败 (返回码 {result.returncode})")
        return False
    print(f"  ✓ {desc} 完成")
    return True


def step1_data_cleaning():
    print("\n" + "=" * 50)
    print("  第一阶段：数据清洗与导入")
    print("=" * 50)
    run_script('01_db_init.py', 'MySQL建库建表 + 数据导入 (6张表)')
    run_script('02_build_vitality.py', '构建空间活力指标体系 (4维度加权)')


def step2_analysis():
    print("\n" + "=" * 50)
    print("  第二阶段：数据分析")
    print("=" * 50)
    run_script('05_analysis_factors.py', '关键因素分析 (天气/节假日/区域/温度等8维度)')


def step3_modeling():
    print("\n" + "=" * 50)
    print("  第三阶段：模型训练与出图")
    print("=" * 50)
    run_script('03_model_xgb_lgb.py', 'XGBoost/LightGBM 回归模型 (4组对照实验)')
    run_script('04_model_lstm.py', 'LSTM 时间序列预测 (TOP10 POI)')
    run_script('04b_model_arima.py', 'ARIMA 时间序列预测 (TOP10 POI)')
    run_script('06_generate_figures.py', '生成论文图表 (13张PNG)')

    print(f"\n  输出目录: {OUTPUT_DIR}/")
    print(f"  图表: {FIGURES_DIR}/ (13张)")
    csv_files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.csv')]
    if csv_files:
        print(f"  CSV数据: {len(csv_files)}个文件")
        for f in sorted(csv_files):
            print(f"    - {f}")


def step4_dashboard():
    port = 5001
    print("\n" + "=" * 50)
    print("  第四阶段：启动可视化大屏")
    print("=" * 50)
    print("\n  选择数据模式:")
    print("    [1] MySQL模式 (需要MySQL运行中)")
    print("    [2] CSV文件模式 (无需MySQL)")
    choice = input("\n  请选择 [1/2，默认1]: ").strip() or '1'
    mode = 'csv' if choice == '2' else 'mysql'

    # 自动清理端口
    kill_port(port)

    webapp_dir = os.path.join(PROJECT_DIR, 'webapp')
    sys.path.insert(0, webapp_dir)
    os.chdir(webapp_dir)

    from app import start
    start(port=port, mode=mode)


def main():
    os.chdir(PROJECT_DIR)
    banner()

    while True:
        menu()
        choice = input("  请选择 [0-5]: ").strip()

        if choice == '1':
            step1_data_cleaning()
        elif choice == '2':
            step2_analysis()
        elif choice == '3':
            step3_modeling()
        elif choice == '4':
            step4_dashboard()
        elif choice == '5':
            step1_data_cleaning()
            step2_analysis()
            step3_modeling()
            print("\n" + "=" * 50)
            print("  全部执行完毕！")
            print(f"  图表输出: {FIGURES_DIR}/")
            print(f"  数据输出: {OUTPUT_DIR}/")
            print("  输入 4 启动可视化大屏查看结果")
            print("=" * 50)
        elif choice == '0':
            print("\n  再见！")
            break
        else:
            print("  无效选择，请重新输入")


if __name__ == '__main__':
    main()
