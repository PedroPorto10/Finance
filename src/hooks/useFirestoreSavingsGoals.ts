import { useState, useEffect, useCallback } from 'react';
import { SavingsGoal } from '@/types/savings';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing savings goals with Firestore
 */
export const useFirestoreSavingsGoals = () => {
  const { user } = useAuth();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSavingsGoals([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<SavingsGoal>(
      user.uid,
      COLLECTIONS.SAVINGS_GOALS,
      (data) => {
        setSavingsGoals(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const addSavingsGoal = useCallback(async (goal: Omit<SavingsGoal, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(goal);
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.SAVINGS_GOALS, dataToStore);
  }, [user?.uid]);

  const updateSavingsGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(updates);
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.SAVINGS_GOALS, id, dataToStore);
  }, [user?.uid]);

  const deleteSavingsGoal = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.SAVINGS_GOALS, id);
  }, [user?.uid]);

  return {
    savingsGoals,
    loading,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal
  };
};
