import { useState, useEffect, useCallback } from 'react';
import { Investment } from '@/types/investment';
import { appInitializer } from '@/lib/appInitializer';
import { settingsService } from '@/lib/settingsService';

// Initialize state with data from appInitializer if available
const getInitialInvestments = (): Investment[] => {
  const settings = appInitializer.getSettings();
  if (settings?.investments && Array.isArray(settings.investments)) {
    console.log('useInvestments: Initializing with cached investments:', settings.investments.length);
    return settings.investments;
  }
  console.log('useInvestments: No cached investments, starting with empty array');
  return [];
};

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>(getInitialInvestments());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load investments from appInitializer (already loaded on app start)
  useEffect(() => {
    let mounted = true;

    const loadInvestments = async () => {
      console.log('useInvestments: Loading investments from appInitializer...');
      const settings = appInitializer.getSettings();

      if (settings) {
        if (mounted) {
          console.log('useInvestments: Loaded investments from cache:', settings.investments);
          // Ensure it's an array
          const invs = Array.isArray(settings.investments) ? settings.investments : [];
          setInvestments(invs);
          setIsInitialized(true);
        }
      } else {
        // Fallback to loading directly if appInitializer not ready
        console.warn('useInvestments: appInitializer not ready, loading directly');
        const invs = await settingsService.getInvestments();
        if (mounted) {
          setInvestments(invs);
          setIsInitialized(true);
        }
      }
    };

    loadInvestments();

    return () => {
      mounted = false;
    };
  }, []);

  // Add a new investment
  const addInvestment = useCallback(async (investment: Investment) => {
    const updatedInvestments = [...investments, investment];
    setInvestments(updatedInvestments);

    // Save to storage and update appInitializer cache
    await settingsService.setInvestments(updatedInvestments);
    await appInitializer.updateInvestments(updatedInvestments);

    return investment;
  }, [investments]);

  // Update an investment
  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>) => {
    const updatedInvestments = investments.map(inv =>
      inv.id === id ? { ...inv, ...updates } : inv
    );
    setInvestments(updatedInvestments);

    // Save to storage and update appInitializer cache
    await settingsService.setInvestments(updatedInvestments);
    await appInitializer.updateInvestments(updatedInvestments);
  }, [investments]);

  // Delete an investment
  const deleteInvestment = useCallback(async (id: string) => {
    const updatedInvestments = investments.filter(inv => inv.id !== id);
    setInvestments(updatedInvestments);

    // Save to storage and update appInitializer cache
    await settingsService.setInvestments(updatedInvestments);
    await appInitializer.updateInvestments(updatedInvestments);
  }, [investments]);

  return {
    investments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    isInitialized,
  };
};
