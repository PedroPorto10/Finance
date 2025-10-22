import { useState, useEffect, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing transactions with Firestore
 * Provides real-time sync and CRUD operations for transactions
 */
export const useFirestoreTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = FirestoreService.subscribeToCollection<Transaction>(
        user.uid,
        COLLECTIONS.TRANSACTIONS,
        (data) => {
          // Sort by date descending (most recent first)
          const sorted = data.sort((a, b) => b.date.getTime() - a.date.getTime());
          setTransactions(sorted);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to transactions:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [user?.uid]);

  // Add a new transaction
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const dataToStore = FirestoreService.convertDatesToTimestamps(transaction);
      const id = await FirestoreService.addDocument(
        user.uid,
        COLLECTIONS.TRANSACTIONS,
        dataToStore
      );
      return id;
    } catch (err) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  }, [user?.uid]);

  // Update an existing transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const dataToStore = FirestoreService.convertDatesToTimestamps(updates);
      await FirestoreService.updateDocument(
        user.uid,
        COLLECTIONS.TRANSACTIONS,
        id,
        dataToStore
      );
    } catch (err) {
      console.error('Error updating transaction:', err);
      throw err;
    }
  }, [user?.uid]);

  // Delete a transaction
  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      await FirestoreService.deleteDocument(
        user.uid,
        COLLECTIONS.TRANSACTIONS,
        id
      );
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }, [user?.uid]);

  // Delete all transactions
  const deleteAllTransactions = useCallback(async (): Promise<void> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const operations = transactions.map(t => ({
        type: 'delete' as const,
        docId: t.id
      }));

      await FirestoreService.batchWrite(
        user.uid,
        COLLECTIONS.TRANSACTIONS,
        operations
      );
    } catch (err) {
      console.error('Error deleting all transactions:', err);
      throw err;
    }
  }, [user?.uid, transactions]);

  // Get monthly data
  const getMonthlyData = useCallback(() => {
    const monthlyMap = new Map<string, { received: number; sent: number }>();

    transactions.forEach(transaction => {
      const monthKey = `${transaction.date.getFullYear()}-${String(transaction.date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { received: 0, sent: 0 });
      }

      const data = monthlyMap.get(monthKey)!;
      if (transaction.type === 'received') {
        data.received += transaction.amount;
      } else {
        data.sent += transaction.amount;
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // Get transactions by category
  const getTransactionsByCategory = useCallback((category: string) => {
    return transactions.filter(t => t.category === category);
  }, [transactions]);

  // Get transactions by date range
  const getTransactionsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return transactions.filter(t =>
      t.date >= startDate && t.date <= endDate
    );
  }, [transactions]);

  // Get total received amount
  const getTotalReceived = useCallback(() => {
    return transactions
      .filter(t => t.type === 'received')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Get total sent amount
  const getTotalSent = useCallback(() => {
    return transactions
      .filter(t => t.type === 'sent')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
    getMonthlyData,
    getTransactionsByCategory,
    getTransactionsByDateRange,
    getTotalReceived,
    getTotalSent
  };
};
