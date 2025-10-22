import { useState, useEffect, useCallback } from 'react';
import { Investment, InvestmentPosition } from '@/types/investment';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing investments and investment positions with Firestore
 */
export const useFirestoreInvestments = () => {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentPositions, setInvestmentPositions] = useState<InvestmentPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to investments
  useEffect(() => {
    if (!user?.uid) {
      setInvestments([]);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<Investment>(
      user.uid,
      COLLECTIONS.INVESTMENTS,
      (data) => setInvestments(data)
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to investment positions
  useEffect(() => {
    if (!user?.uid) {
      setInvestmentPositions([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<InvestmentPosition>(
      user.uid,
      COLLECTIONS.INVESTMENT_POSITIONS,
      (data) => {
        setInvestmentPositions(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Investment Methods
  const addInvestment = useCallback(async (investment: Omit<Investment, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(investment);
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.INVESTMENTS, dataToStore);
  }, [user?.uid]);

  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(updates);
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.INVESTMENTS, id, dataToStore);
  }, [user?.uid]);

  const deleteInvestment = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.INVESTMENTS, id);
  }, [user?.uid]);

  // Investment Position Methods
  const addInvestmentPosition = useCallback(async (position: Omit<InvestmentPosition, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(position);
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.INVESTMENT_POSITIONS, dataToStore);
  }, [user?.uid]);

  const updateInvestmentPosition = useCallback(async (id: string, updates: Partial<InvestmentPosition>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const dataToStore = FirestoreService.convertDatesToTimestamps(updates);
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.INVESTMENT_POSITIONS, id, dataToStore);
  }, [user?.uid]);

  const deleteInvestmentPosition = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.INVESTMENT_POSITIONS, id);
  }, [user?.uid]);

  return {
    investments,
    investmentPositions,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentPosition,
    updateInvestmentPosition,
    deleteInvestmentPosition
  };
};
