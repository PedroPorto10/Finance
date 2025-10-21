import { useState, useEffect, useCallback } from 'react';
import { SavingsGoal, SavingsContribution, SavingsProgress } from '@/types/savings';
import { appInitializer } from '@/lib/appInitializer';
import { settingsService } from '@/lib/settingsService';

// Initialize state with data from appInitializer if available
const getInitialSavingsGoals = (): SavingsGoal[] => {
  const settings = appInitializer.getSettings();
  if (settings?.savingsGoals && Array.isArray(settings.savingsGoals)) {
    console.log('useSavingsGoals: Initializing with cached goals:', settings.savingsGoals.length);
    return settings.savingsGoals;
  }
  console.log('useSavingsGoals: No cached goals, starting with empty array');
  return [];
};

export const useSavingsGoals = () => {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(getInitialSavingsGoals());
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from appInitializer (already loaded on app start)
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log('useSavingsGoals: Loading goals from appInitializer...');
      const settings = appInitializer.getSettings();

      if (settings) {
        if (mounted) {
          console.log('useSavingsGoals: Loaded goals from cache:', settings.savingsGoals);
          // Ensure it's an array
          const goals = Array.isArray(settings.savingsGoals) ? settings.savingsGoals : [];
          setSavingsGoals(goals);
          setIsInitialized(true);
        }
      } else {
        // Fallback to loading directly if appInitializer not ready
        console.warn('useSavingsGoals: appInitializer not ready, loading directly');
        const goals = await settingsService.getSavingsGoals();
        if (mounted) {
          setSavingsGoals(goals);
          setIsInitialized(true);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Add a new savings goal
  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newGoal = await settingsService.addSavingsGoal(goal);

    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);

    // Update appInitializer cache
    await appInitializer.updateSavingsGoals(updatedGoals);

    return newGoal;
  }, [savingsGoals]);

  // Update a savings goal
  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    const updated = await settingsService.updateSavingsGoal(id, updates);
    if (updated) {
      const updatedGoals = savingsGoals.map(g => g.id === id ? updated : g);
      setSavingsGoals(updatedGoals);

      // Update appInitializer cache
      await appInitializer.updateSavingsGoals(updatedGoals);
    }
  }, [savingsGoals]);

  // Delete a savings goal
  const deleteSavingsGoal = useCallback(async (id: string) => {
    const success = await settingsService.deleteSavingsGoal(id);
    if (success) {
      const updatedGoals = savingsGoals.filter(g => g.id !== id);
      setSavingsGoals(updatedGoals);

      // Update appInitializer cache
      await appInitializer.updateSavingsGoals(updatedGoals);
    }
  }, [savingsGoals]);

  // Add a contribution to a goal
  const addContribution = useCallback(async (contribution: Omit<SavingsContribution, 'id'>) => {
    const updatedGoal = await settingsService.addContribution(contribution.goalId, contribution.amount);
    if (updatedGoal) {
      const updatedGoals = savingsGoals.map(g => g.id === contribution.goalId ? updatedGoal : g);
      setSavingsGoals(updatedGoals);

      // Update appInitializer cache
      await appInitializer.updateSavingsGoals(updatedGoals);
    }

    // Create contribution record for tracking
    const newContribution: SavingsContribution = {
      ...contribution,
      id: crypto.randomUUID(),
    };
    setContributions(prev => [...prev, newContribution]);
    return newContribution;
  }, [savingsGoals]);

  // Calculate savings progress for a goal
  const calculateSavingsProgress = useCallback((goal: SavingsGoal): SavingsProgress => {
    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    let monthsToGoal: number | undefined;
    let recommendedMonthlyAmount: number | undefined;
    let projectedCompletionDate: Date | undefined;
    let isOnTrack = true;

    if (goal.targetDate && remaining > 0) {
      const now = new Date();
      const monthsRemaining = Math.max(1,
        (goal.targetDate.getFullYear() - now.getFullYear()) * 12 +
        (goal.targetDate.getMonth() - now.getMonth())
      );

      recommendedMonthlyAmount = remaining / monthsRemaining;
      monthsToGoal = monthsRemaining;

      // Check if current monthly contribution rate will meet the goal
      if (goal.monthlyContribution) {
        const projectedMonths = remaining / goal.monthlyContribution;
        projectedCompletionDate = new Date();
        projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + projectedMonths);
        isOnTrack = projectedCompletionDate <= goal.targetDate;
      } else {
        isOnTrack = false;
      }
    } else if (goal.monthlyContribution && remaining > 0) {
      monthsToGoal = Math.ceil(remaining / goal.monthlyContribution);
      projectedCompletionDate = new Date();
      projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsToGoal);
    }

    return {
      goal,
      percentage,
      remaining,
      monthsToGoal,
      recommendedMonthlyAmount,
      isOnTrack,
      projectedCompletionDate,
    };
  }, []);

  // Get all savings progress
  const getAllSavingsProgress = useCallback((): SavingsProgress[] => {
    return savingsGoals
      .filter(goal => goal.isActive)
      .map(goal => calculateSavingsProgress(goal))
      .sort((a, b) => {
        // Sort by priority (high first), then by percentage completion
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.goal.priority];
        const bPriority = priorityOrder[b.goal.priority];

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return b.percentage - a.percentage;
      });
  }, [savingsGoals, calculateSavingsProgress]);

  // Get contributions for a specific goal
  const getGoalContributions = useCallback((goalId: string): SavingsContribution[] => {
    return contributions
      .filter(contrib => contrib.goalId === goalId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [contributions]);

  // Get total savings across all goals
  const getTotalSavings = useCallback(() => {
    return savingsGoals.reduce((total, goal) => total + goal.currentAmount, 0);
  }, [savingsGoals]);

  // Get savings summary
  const getSavingsSummary = useCallback(() => {
    const totalSaved = getTotalSavings();
    const totalTarget = savingsGoals
      .filter(goal => goal.isActive)
      .reduce((total, goal) => total + goal.targetAmount, 0);

    const activeGoals = savingsGoals.filter(goal => goal.isActive).length;
    const completedGoals = savingsGoals.filter(goal =>
      goal.currentAmount >= goal.targetAmount
    ).length;

    const monthlyContributions = savingsGoals
      .filter(goal => goal.isActive && goal.monthlyContribution)
      .reduce((total, goal) => total + (goal.monthlyContribution || 0), 0);

    return {
      totalSaved,
      totalTarget,
      totalRemaining: Math.max(0, totalTarget - totalSaved),
      progressPercentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      activeGoals,
      completedGoals,
      monthlyContributions,
    };
  }, [savingsGoals, getTotalSavings]);

  return {
    savingsGoals,
    contributions,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addContribution,
    calculateSavingsProgress,
    getAllSavingsProgress,
    getGoalContributions,
    getTotalSavings,
    getSavingsSummary,
  };
};