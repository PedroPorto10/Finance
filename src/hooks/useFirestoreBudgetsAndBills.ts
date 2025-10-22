import { useState, useEffect, useCallback } from 'react';
import { BudgetAlert } from '@/types/budget';
import { BillReminder } from '@/types/billReminder';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing budget alerts and bill reminders with Firestore
 */
export const useFirestoreBudgetsAndBills = () => {
  const { user } = useAuth();
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to budget alerts
  useEffect(() => {
    if (!user?.uid) {
      setBudgetAlerts([]);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<BudgetAlert>(
      user.uid,
      COLLECTIONS.BUDGET_ALERTS,
      (data) => setBudgetAlerts(data)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to bill reminders
  useEffect(() => {
    if (!user?.uid) {
      setBillReminders([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<BillReminder>(
      user.uid,
      COLLECTIONS.BILL_REMINDERS,
      (data) => {
        setBillReminders(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Budget Alert Methods
  const addBudgetAlert = useCallback(async (alert: Omit<BudgetAlert, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.BUDGET_ALERTS, alert);
  }, [user?.uid]);

  const updateBudgetAlert = useCallback(async (id: string, updates: Partial<BudgetAlert>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.BUDGET_ALERTS, id, updates);
  }, [user?.uid]);

  const deleteBudgetAlert = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.BUDGET_ALERTS, id);
  }, [user?.uid]);

  // Bill Reminder Methods
  const addBillReminder = useCallback(async (bill: Omit<BillReminder, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(bill);
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.BILL_REMINDERS, dataToStore);
  }, [user?.uid]);

  const updateBillReminder = useCallback(async (id: string, updates: Partial<BillReminder>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(updates);
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.BILL_REMINDERS, id, dataToStore);
  }, [user?.uid]);

  const deleteBillReminder = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.BILL_REMINDERS, id);
  }, [user?.uid]);

  return {
    budgetAlerts,
    billReminders,
    loading,
    addBudgetAlert,
    updateBudgetAlert,
    deleteBudgetAlert,
    addBillReminder,
    updateBillReminder,
    deleteBillReminder
  };
};
