import { useState, useEffect } from 'react';

const STORAGE_KEY = 'investment_preferences_v1';

interface InvestmentPreferences {
  selectedInvestmentType: string;
}

const defaultPreferences: InvestmentPreferences = {
  selectedInvestmentType: ''
};

const loadStoredPreferences = (): InvestmentPreferences => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultPreferences;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as InvestmentPreferences;
      console.log('Loaded investment preferences:', parsed);
      return parsed;
    } else {
      // No stored preferences found - create and save defaults
      console.log('No investment preferences found, creating defaults');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
      return defaultPreferences;
    }
  } catch (error) {
    console.error('Error loading investment preferences:', error);
  }
  return defaultPreferences;
};

export const useInvestmentPreferences = () => {
  const [preferences, setPreferences] = useState<InvestmentPreferences>(loadStoredPreferences());
  const [isLoaded, setIsLoaded] = useState(true);

  const persistPreferences = (newPreferences: InvestmentPreferences) => {
    try {
      console.log('Saving investment preferences:', newPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving investment preferences:', error);
    }
  };

  const setSelectedInvestmentType = (investmentType: string) => {
    setPreferences(prev => {
      const updated = { ...prev, selectedInvestmentType: investmentType };
      persistPreferences(updated);
      return updated;
    });
  };

  const clearPreferences = () => {
    setPreferences(prev => {
      try {
        localStorage.removeItem(STORAGE_KEY);
        return defaultPreferences;
      } catch (error) {
        console.error('Error clearing investment preferences:', error);
        return prev;
      }
    });
  };

  return {
    selectedInvestmentType: preferences.selectedInvestmentType,
    setSelectedInvestmentType,
    clearPreferences,
    isLoaded
  };
};