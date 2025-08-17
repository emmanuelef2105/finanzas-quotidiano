import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/financeAPI';

export const useDashboard = (dateRange = null) => {
  const [summary, setSummary] = useState({
    currentCapital: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    debtsToCollect: 0,
    myDebts: 0,
    netWorth: 0,
    monthlyBalance: 0,
  });
  
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryStats, setCategoryStats] = useState({ expenses: [], income: [] });
  const [monthlyEvolution, setMonthlyEvolution] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summaryRes,
        transactionsRes,
        statsRes,
        evolutionRes,
        alertsRes,
      ] = await Promise.all([
        dashboardAPI.getSummary(dateRange),
        dashboardAPI.getRecentTransactions(10, dateRange),
        dashboardAPI.getCategoryStats(dateRange),
        dashboardAPI.getMonthlyEvolution(),
        dashboardAPI.getAlerts(),
      ]);

      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data);
      setCategoryStats(statsRes.data);
      setMonthlyEvolution(evolutionRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      setError(err.message || 'Error al cargar datos del dashboard');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    summary,
    recentTransactions,
    categoryStats,
    monthlyEvolution,
    alerts,
    loading,
    error,
    refreshDashboard,
  };
};
