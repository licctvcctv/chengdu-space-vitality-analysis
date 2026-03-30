import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData } from '../api/dashboardService';
import { useUI } from '../components/ui/UIProvider';

type RefreshStatus = 'idle' | 'syncing' | 'success' | 'error';

export const useDashboard = () => {
  const { message } = useUI();
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAlerting, setIsAlerting] = useState(false);
  const [heatThreshold, setHeatThreshold] = useState(19000);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>('idle');
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = useCallback(
    async (showToast = false) => {
      try {
        setRefreshStatus('syncing');
        const result = await dashboardService.getDashboardData();
        setData(result);
        setRefreshStatus('success');
        setLastRefreshAt(new Date());
        if (showToast) {
          message.success('空间活力数据加载完成');
        }
      } catch (error) {
        setRefreshStatus('error');
        message.error('数据加载失败，请检查服务状态');
      } finally {
        setLoading(false);
      }
    },
    [message]
  );

  useEffect(() => {
    refreshData(false);
  }, [refreshData]);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshData(false);
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    if (!data) return;
    const hotListMax = Math.max(...data.hotSearch.map((item) => item.heat));
    const trendMax = Math.max(...data.trend.filter((item) => item.forecast !== null).map((item) => item.forecast || 0));
    setIsAlerting(Math.max(hotListMax, trendMax) > heatThreshold);
  }, [data, heatThreshold]);

  return {
    time,
    data,
    loading,
    isAlerting,
    heatThreshold,
    setHeatThreshold,
    refreshStatus,
    lastRefreshAt,
    refreshData
  };
};
