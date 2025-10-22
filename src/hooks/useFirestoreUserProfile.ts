import { useState, useEffect, useCallback } from 'react';
import { FirestoreService } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  monthlyIncome: number;
  createdAt?: Date;
  updatedAt?: Date;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    currency?: string;
    language?: string;
  };
}

/**
 * Hook for managing user profile with Firestore
 */
export const useFirestoreUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profileData = await FirestoreService.getUserProfile(user.uid);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user?.uid) throw new Error('User not authenticated');

    await FirestoreService.updateUserProfile(user.uid, updates);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  }, [user?.uid]);

  const setMonthlyIncome = useCallback(async (income: number): Promise<void> => {
    await updateProfile({ monthlyIncome: income });
  }, [updateProfile]);

  return {
    profile,
    loading,
    updateProfile,
    setMonthlyIncome,
    monthlyIncome: profile?.monthlyIncome || 0
  };
};
