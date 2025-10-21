import { useState, useEffect, useCallback } from 'react';
import { BudgetAlert, BudgetStatus, BudgetPeriod } from '@/types/budget';
import { Transaction } from '@/types/transaction';
import { LocalNotifications } from '@capacitor/local-notifications';
import { appInitializer } from '@/lib/appInitializer';
import { settingsService } from '@/lib/settingsService';

// Initialize state with data from appInitializer if available
const getInitialBudgetAlerts = (): BudgetAlert[] => {
  const settings = appInitializer.getSettings();
  if (settings?.budgetAlerts && Array.isArray(settings.budgetAlerts)) {
    console.log('useBudgetAlerts: Initializing with cached alerts:', settings.budgetAlerts.length);
    return settings.budgetAlerts;
  }
  console.log('useBudgetAlerts: No cached alerts, starting with empty array');
  return [];
};

export const useBudgetAlerts = () => {
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>(getInitialBudgetAlerts());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load budget alerts from appInitializer (already loaded on app start)
  useEffect(() => {
    let mounted = true;

    const loadBudgetAlerts = async () => {
      console.log('useBudgetAlerts: Loading budget alerts from appInitializer...');
      const settings = appInitializer.getSettings();

      if (settings) {
        if (mounted) {
          console.log('useBudgetAlerts: Loaded alerts from cache:', settings.budgetAlerts);
          // Ensure it's an array
          const alerts = Array.isArray(settings.budgetAlerts) ? settings.budgetAlerts : [];
          setBudgetAlerts(alerts);
          setIsInitialized(true);
        }
      } else {
        // Fallback to loading directly if appInitializer not ready
        console.warn('useBudgetAlerts: appInitializer not ready, loading directly');
        const alerts = await settingsService.getBudgetAlerts();
        if (mounted) {
          setBudgetAlerts(alerts);
          setIsInitialized(true);
        }
      }
    };

    loadBudgetAlerts();

    return () => {
      mounted = false;
    };
  }, []);

  // Add a new budget alert
  const addBudgetAlert = useCallback(async (alert: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('useBudgetAlerts: addBudgetAlert called with:', alert);
    const newAlert = await settingsService.addBudgetAlert(alert);
    console.log('useBudgetAlerts: Created new alert:', newAlert);

    const updatedAlerts = [...budgetAlerts, newAlert];
    setBudgetAlerts(updatedAlerts);

    // Update appInitializer cache
    await appInitializer.updateBudgetAlerts(updatedAlerts);

    return newAlert;
  }, [budgetAlerts]);

  // Update a budget alert
  const updateBudgetAlert = useCallback(async (id: string, updates: Partial<BudgetAlert>) => {
    const updated = await settingsService.updateBudgetAlert(id, updates);
    if (updated) {
      const updatedAlerts = budgetAlerts.map(a => a.id === id ? updated : a);
      setBudgetAlerts(updatedAlerts);

      // Update appInitializer cache
      await appInitializer.updateBudgetAlerts(updatedAlerts);
    }
  }, [budgetAlerts]);

  // Delete a budget alert
  const deleteBudgetAlert = useCallback(async (id: string) => {
    const success = await settingsService.deleteBudgetAlert(id);
    if (success) {
      const updatedAlerts = budgetAlerts.filter(a => a.id !== id);
      setBudgetAlerts(updatedAlerts);

      // Update appInitializer cache
      await appInitializer.updateBudgetAlerts(updatedAlerts);
    }
  }, [budgetAlerts]);

  // Get budget period dates
  const getBudgetPeriod = useCallback((type: BudgetAlert['period']): BudgetPeriod => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (type) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly': {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
    }

    return { startDate, endDate, type };
  }, []);

  // Calculate budget status for a category
  const calculateBudgetStatus = useCallback((
    alert: BudgetAlert,
    transactions: Transaction[]
  ): BudgetStatus => {
    const period = getBudgetPeriod(alert.period);

    const categoryTransactions = transactions.filter(t =>
      t.type === 'sent' &&
      t.category === alert.category &&
      t.date >= period.startDate &&
      t.date < period.endDate
    );

    const spent = categoryTransactions.reduce((total, t) => total + t.amount, 0);
    const remaining = Math.max(0, alert.limit - spent);
    const percentage = (spent / alert.limit) * 100;
    const isOverBudget = spent > alert.limit;
    const isNearLimit = percentage >= alert.threshold;

    return {
      category: alert.category,
      limit: alert.limit,
      spent,
      remaining,
      percentage,
      isOverBudget,
      isNearLimit,
      threshold: alert.threshold,
    };
  }, [getBudgetPeriod]);

  // Get all budget statuses
  const getBudgetStatuses = useCallback((transactions: Transaction[]): BudgetStatus[] => {
    return budgetAlerts
      .filter(alert => alert.isActive)
      .map(alert => calculateBudgetStatus(alert, transactions));
  }, [budgetAlerts, calculateBudgetStatus]);

  // Check for budget alerts and send notifications
  const checkBudgetAlerts = useCallback(async (transactions: Transaction[]) => {
    const statuses = getBudgetStatuses(transactions);
    const alertsToNotify: BudgetStatus[] = [];

    for (const status of statuses) {
      const alert = budgetAlerts.find(a => a.category === status.category && a.isActive);
      if (!alert) continue;

      if (status.isNearLimit && alert.notifications.push) {
        alertsToNotify.push(status);
      }
    }

    // Send push notifications
    if (alertsToNotify.length > 0) {
      try {
        const notifications = alertsToNotify.map((status, index) => ({
          title: 'Alerta de Orçamento',
          body: status.isOverBudget
            ? `Você ultrapassou o orçamento de ${status.category}! Gasto: R$ ${status.spent.toFixed(2)}`
            : `Atenção! Você já gastou ${status.percentage.toFixed(1)}% do orçamento de ${status.category}`,
          id: Date.now() + index,
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            category: status.category,
            type: 'budget_alert'
          }
        }));

        await LocalNotifications.schedule({ notifications });
      } catch (error) {
        console.error('Error sending budget notifications:', error);
      }
    }

    return alertsToNotify;
  }, [budgetAlerts, getBudgetStatuses]);

  return {
    budgetAlerts,
    addBudgetAlert,
    updateBudgetAlert,
    deleteBudgetAlert,
    getBudgetStatuses,
    calculateBudgetStatus,
    checkBudgetAlerts,
    getBudgetPeriod,
  };
};