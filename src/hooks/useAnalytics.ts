import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { CategoryInsight, MerchantInsight, MonthlySpending, SpendingPattern, FinancialHealth, TransactionFilter } from '@/types/analytics';

export const useAnalytics = () => {
  // Filter transactions based on criteria
  const filterTransactions = useCallback((
    transactions: Transaction[],
    filter: TransactionFilter
  ): Transaction[] => {
    return transactions.filter(transaction => {
      // Date range filter
      if (filter.dateRange) {
        if (transaction.date < filter.dateRange.startDate ||
            transaction.date > filter.dateRange.endDate) {
          return false;
        }
      }

      // Category filter
      if (filter.categories && filter.categories.length > 0) {
        if (!transaction.category || !filter.categories.includes(transaction.category)) {
          return false;
        }
      }

      // Amount range filter
      if (filter.amountRange) {
        if (transaction.amount < filter.amountRange.min ||
            transaction.amount > filter.amountRange.max) {
          return false;
        }
      }

      // Transaction type filter
      if (filter.type && filter.type !== 'all') {
        if (transaction.type !== filter.type) {
          return false;
        }
      }

      // Contact filter
      if (filter.contact) {
        if (!transaction.contact.toLowerCase().includes(filter.contact.toLowerCase())) {
          return false;
        }
      }

      // Description filter
      if (filter.description && transaction.description) {
        if (!transaction.description.toLowerCase().includes(filter.description.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const sortBy = filter.sortBy || 'date';
      const sortOrder = filter.sortOrder || 'desc';
      const multiplier = sortOrder === 'asc' ? 1 : -1;

      switch (sortBy) {
        case 'date':
          return (a.date.getTime() - b.date.getTime()) * multiplier;
        case 'amount':
          return (a.amount - b.amount) * multiplier;
        case 'contact':
          return a.contact.localeCompare(b.contact) * multiplier;
        default:
          return 0;
      }
    });
  }, []);

  // Get category insights
  const getCategoryInsights = useCallback((transactions: Transaction[]): CategoryInsight[] => {
    const categoryMap = new Map<string, Transaction[]>();
    const totalSpent = transactions
      .filter(t => t.type === 'sent')
      .reduce((total, t) => total + t.amount, 0);

    // Group transactions by category
    transactions
      .filter(t => t.type === 'sent' && t.category)
      .forEach(transaction => {
        const category = transaction.category!;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(transaction);
      });

    const insights: CategoryInsight[] = [];

    categoryMap.forEach((categoryTransactions, category) => {
      const spent = categoryTransactions.reduce((total, t) => total + t.amount, 0);
      const transactionCount = categoryTransactions.length;
      const averageTransaction = spent / transactionCount;
      const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;

      // Calculate trend (comparing last 30 days to previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const lastMonth = categoryTransactions
        .filter(t => t.date >= thirtyDaysAgo)
        .reduce((total, t) => total + t.amount, 0);

      const previousMonth = categoryTransactions
        .filter(t => t.date >= sixtyDaysAgo && t.date < thirtyDaysAgo)
        .reduce((total, t) => total + t.amount, 0);

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (previousMonth > 0) {
        const change = ((lastMonth - previousMonth) / previousMonth) * 100;
        trendPercentage = Math.abs(change);
        if (change > 5) trend = 'increasing';
        else if (change < -5) trend = 'decreasing';
      } else if (lastMonth > 0) {
        trend = 'increasing';
        trendPercentage = 100;
      }

      // Get top merchants for this category
      const merchantMap = new Map<string, Transaction[]>();
      categoryTransactions.forEach(t => {
        if (!merchantMap.has(t.contact)) {
          merchantMap.set(t.contact, []);
        }
        merchantMap.get(t.contact)!.push(t);
      });

      const topMerchants: MerchantInsight[] = Array.from(merchantMap.entries())
        .map(([contact, merchantTransactions]) => {
          const merchantSpent = merchantTransactions.reduce((total, t) => total + t.amount, 0);
          const merchantCount = merchantTransactions.length;
          const merchantAverage = merchantSpent / merchantCount;
          const merchantPercentage = spent > 0 ? (merchantSpent / spent) * 100 : 0;
          const lastTransaction = merchantTransactions.sort((a, b) =>
            b.date.getTime() - a.date.getTime()
          )[0];

          // Determine frequency
          const dates = merchantTransactions.map(t => t.date).sort((a, b) => a.getTime() - b.getTime());
          let frequency: 'daily' | 'weekly' | 'monthly' | 'occasional' = 'occasional';

          if (dates.length > 1) {
            const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
            const avgDaysBetween = totalDays / (dates.length - 1);

            if (avgDaysBetween <= 7) frequency = 'daily';
            else if (avgDaysBetween <= 14) frequency = 'weekly';
            else if (avgDaysBetween <= 35) frequency = 'monthly';
          }

          return {
            contact,
            totalSpent: merchantSpent,
            transactionCount: merchantCount,
            averageTransaction: merchantAverage,
            percentage: merchantPercentage,
            lastTransaction: lastTransaction.date,
            frequency,
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Monthly breakdown
      const monthlyBreakdown: MonthlySpending[] = [];
      const monthlyMap = new Map<string, { amount: number; count: number }>();

      categoryTransactions.forEach(t => {
        const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
        const monthName = t.date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { amount: 0, count: 0 });
        }
        const monthData = monthlyMap.get(monthKey)!;
        monthData.amount += t.amount;
        monthData.count += 1;
      });

      Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthName = new Date(parseInt(year), parseInt(month)).toLocaleDateString('pt-BR', {
            month: 'short'
          });

          monthlyBreakdown.push({
            month: monthName,
            year: parseInt(year),
            amount: data.amount,
            transactionCount: data.count,
          });
        });

      insights.push({
        category,
        totalSpent: spent,
        transactionCount,
        averageTransaction,
        percentage,
        trend,
        trendPercentage,
        topMerchants,
        monthlyBreakdown,
      });
    });

    return insights.sort((a, b) => b.totalSpent - a.totalSpent);
  }, []);

  // Get spending patterns
  const getSpendingPatterns = useCallback((transactions: Transaction[]): SpendingPattern[] => {
    const patterns = new Map<string, { amount: number; frequency: number }>();

    transactions
      .filter(t => t.type === 'sent')
      .forEach(transaction => {
        const dayOfWeek = transaction.date.toLocaleDateString('pt-BR', { weekday: 'long' });
        const hour = transaction.date.getHours();
        const key = `${dayOfWeek}-${hour}`;

        if (!patterns.has(key)) {
          patterns.set(key, { amount: 0, frequency: 0 });
        }
        const pattern = patterns.get(key)!;
        pattern.amount += transaction.amount;
        pattern.frequency += 1;
      });

    return Array.from(patterns.entries()).map(([key, data]) => {
      const [dayOfWeek, hourStr] = key.split('-');
      return {
        dayOfWeek,
        hour: parseInt(hourStr),
        amount: data.amount,
        frequency: data.frequency,
      };
    }).sort((a, b) => b.frequency - a.frequency);
  }, []);

  // Calculate financial health score
  const calculateFinancialHealth = useCallback((
    transactions: Transaction[],
    monthlyIncome: number
  ): FinancialHealth => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => t.date >= thirtyDaysAgo);
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'sent')
      .reduce((total, t) => total + t.amount, 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Calculate spending consistency (lower variance is better)
    const dailySpending: number[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const daySpent = recentTransactions
        .filter(t => t.type === 'sent' && t.date >= dayStart && t.date < dayEnd)
        .reduce((total, t) => total + t.amount, 0);

      dailySpending.push(daySpent);
    }

    const avgDailySpending = dailySpending.reduce((a, b) => a + b, 0) / dailySpending.length;
    const variance = dailySpending.reduce((sum, spending) =>
      sum + Math.pow(spending - avgDailySpending, 2), 0) / dailySpending.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance) / avgDailySpending * 100);

    // Category balance (how well spending is distributed across categories)
    const categorySpending = getCategoryInsights(recentTransactions);
    const categoryBalance = categorySpending.length > 0 ?
      Math.max(0, 100 - Math.max(...categorySpending.map(c => c.percentage))) : 50;

    // Emergency fund estimation (assuming 3-6 months of expenses is ideal)
    const emergencyFund = Math.min(100, (monthlySavings * 6 / monthlyExpenses) * 100);

    const factors = {
      savingsRate: Math.max(0, Math.min(100, savingsRate)),
      spendingConsistency: Math.max(0, Math.min(100, consistency)),
      categoryBalance: Math.max(0, Math.min(100, categoryBalance)),
      emergencyFund: Math.max(0, Math.min(100, emergencyFund)),
    };

    const score = (
      factors.savingsRate * 0.3 +
      factors.spendingConsistency * 0.2 +
      factors.categoryBalance * 0.2 +
      factors.emergencyFund * 0.3
    );

    const recommendations: string[] = [];
    if (factors.savingsRate < 20) recommendations.push('Tente economizar pelo menos 20% da sua renda mensal');
    if (factors.spendingConsistency < 60) recommendations.push('Mantenha gastos mais consistentes dia a dia');
    if (factors.categoryBalance < 60) recommendations.push('Diversifique seus gastos entre categorias');
    if (factors.emergencyFund < 30) recommendations.push('Construa uma reserva de emergência');

    const riskLevel: 'low' | 'medium' | 'high' =
      score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

    return {
      score: Math.round(score),
      factors,
      recommendations,
      riskLevel,
    };
  }, [getCategoryInsights]);

  // Search transactions
  const searchTransactions = useCallback((
    transactions: Transaction[],
    query: string
  ): Transaction[] => {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) return transactions;

    return transactions.filter(transaction => {
      const searchText = [
        transaction.contact,
        transaction.description || '',
        transaction.category || '',
        transaction.amount.toString(),
        transaction.date.toLocaleDateString('pt-BR'),
      ].join(' ').toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, []);

  return {
    filterTransactions,
    getCategoryInsights,
    getSpendingPatterns,
    calculateFinancialHealth,
    searchTransactions,
  };
};