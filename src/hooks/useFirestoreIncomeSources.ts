import { useState, useEffect, useCallback } from 'react';
import { IncomeSource, IncomeAnalysis } from '@/types/incomeSource';
import { Transaction } from '@/types/transaction';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing income sources with Firestore
 * Provides real-time sync and CRUD operations for income sources
 */
export const useFirestoreIncomeSources = () => {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setIncomeSources([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = FirestoreService.subscribeToCollection<IncomeSource>(
        user.uid,
        COLLECTIONS.INCOME_SOURCES,
        (data) => {
          setIncomeSources(data);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to income sources:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [user?.uid]);

  // Add a new income source
  const addIncomeSource = useCallback(async (source: Omit<IncomeSource, 'id'>): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const newSource: Omit<IncomeSource, 'id'> = {
        ...source,
        frequency: source.frequency || 'monthly',
        isActive: source.isActive ?? true
      };

      const id = await FirestoreService.addDocument(
        user.uid,
        COLLECTIONS.INCOME_SOURCES,
        newSource
      );
      return id;
    } catch (err) {
      console.error('Error adding income source:', err);
      throw err;
    }
  }, [user?.uid]);

  // Update an existing income source
  const updateIncomeSource = useCallback(async (id: string, updates: Partial<IncomeSource>): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      await FirestoreService.updateDocument(
        user.uid,
        COLLECTIONS.INCOME_SOURCES,
        id,
        updates
      );
    } catch (err) {
      console.error('Error updating income source:', err);
      throw err;
    }
  }, [user?.uid]);

  // Delete an income source
  const deleteIncomeSource = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      await FirestoreService.deleteDocument(
        user.uid,
        COLLECTIONS.INCOME_SOURCES,
        id
      );
    } catch (err) {
      console.error('Error deleting income source:', err);
      throw err;
    }
  }, [user?.uid]);

  // Analyze income from transactions
  const analyzeIncome = useCallback((transactions: Transaction[]): IncomeAnalysis => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthReceived = transactions.filter(t =>
      t.type === 'received' &&
      t.date.getMonth() === currentMonth &&
      t.date.getFullYear() === currentYear
    );

    const incomeBreakdown: IncomeAnalysis['incomeBreakdown'] = [];
    let workIncome = 0;
    let otherIncome = 0;

    const matchedTransactions = new Set<string>();

    incomeSources.forEach(source => {
      if (!source.isActive) return;

      const sourceTransactions = currentMonthReceived.filter(t => {
        if (matchedTransactions.has(t.id)) return false;

        const contactNormalized = t.contact.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim();

        const patternNormalized = source.contactPattern.toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim();

        return contactNormalized.includes(patternNormalized) ||
               patternNormalized.includes(contactNormalized);
      });

      if (sourceTransactions.length > 0) {
        const sourceAmount = sourceTransactions.reduce((sum, t) => sum + t.amount, 0);

        sourceTransactions.forEach(t => matchedTransactions.add(t.id));

        incomeBreakdown.push({
          sourceId: source.id,
          sourceName: source.name,
          type: source.type,
          amount: sourceAmount
        });

        if (source.type === 'work' || source.type === 'freelance') {
          workIncome += sourceAmount;
        } else {
          otherIncome += sourceAmount;
        }
      }
    });

    const unmatchedTransactions = currentMonthReceived.filter(t => !matchedTransactions.has(t.id));
    if (unmatchedTransactions.length > 0) {
      const unmatchedAmount = unmatchedTransactions.reduce((sum, t) => sum + t.amount, 0);
      otherIncome += unmatchedAmount;

      incomeBreakdown.push({
        sourceId: 'unmatched',
        sourceName: 'Outras receitas não categorizadas',
        type: 'other',
        amount: unmatchedAmount
      });
    }

    return {
      workIncome,
      otherIncome,
      totalIncome: workIncome + otherIncome,
      incomeBreakdown
    };
  }, [incomeSources]);

  // Get monthly amount from source
  const getMonthlyAmountFromSource = useCallback((source: IncomeSource): number => {
    if (!source.expectedAmount) return 0;

    switch (source.frequency) {
      case 'monthly':
        return source.expectedAmount;
      case 'biweekly':
        return source.expectedAmount * 2;
      case 'weekly':
        return source.expectedAmount * 4.33;
      case 'daily':
        return source.expectedAmount * 22;
      case 'custom':
        if (source.customFrequencyDays) {
          const paymentsPerMonth = 30 / source.customFrequencyDays;
          return source.expectedAmount * paymentsPerMonth;
        }
        return source.expectedAmount;
      default:
        return source.expectedAmount;
    }
  }, []);

  // Get total expected income
  const getTotalExpectedIncome = useCallback((): number => {
    return incomeSources
      .filter(source => source.isActive && source.expectedAmount)
      .reduce((sum, source) => sum + getMonthlyAmountFromSource(source), 0);
  }, [incomeSources, getMonthlyAmountFromSource]);

  return {
    incomeSources,
    loading,
    error,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    analyzeIncome,
    getTotalExpectedIncome,
    getMonthlyAmountFromSource
  };
};
