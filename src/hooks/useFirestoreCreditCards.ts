import { useState, useEffect, useCallback } from 'react';
import { CreditCard } from '@/types/creditCard';
import { FirestoreService, COLLECTIONS } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for managing credit cards with Firestore
 */
export const useFirestoreCreditCards = () => {
  const { user } = useAuth();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setCreditCards([]);
      setLoading(false);
      return;
    }

    const unsubscribe = FirestoreService.subscribeToCollection<CreditCard>(
      user.uid,
      COLLECTIONS.CREDIT_CARDS,
      (data) => {
        setCreditCards(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id'>): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    return await FirestoreService.addDocument(user.uid, COLLECTIONS.CREDIT_CARDS, card);
  }, [user?.uid]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.updateDocument(user.uid, COLLECTIONS.CREDIT_CARDS, id, updates);
  }, [user?.uid]);

  const deleteCreditCard = useCallback(async (id: string): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');
    await FirestoreService.deleteDocument(user.uid, COLLECTIONS.CREDIT_CARDS, id);
  }, [user?.uid]);

  return {
    creditCards,
    loading,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard
  };
};
