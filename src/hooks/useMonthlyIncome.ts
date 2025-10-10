import { useState, useEffect } from 'react';

const STORAGE_KEY = 'monthly_income';

const loadStoredMonthlyIncome = (): number => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 0;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = parseFloat(stored);
      console.log('Loaded monthly income:', value);
      return value;
    } else {
      // No stored income found - create and save default (0)
      console.log('No monthly income found, creating default (0)');
      localStorage.setItem(STORAGE_KEY, '0');
      return 0;
    }
  } catch (error) {
    console.error('Error loading monthly income:', error);
    return 0;
  }
};

export const useMonthlyIncome = () => {
  const [monthlyIncome, setMonthlyIncomeState] = useState<number>(loadStoredMonthlyIncome());
  const [isLoaded, setIsLoaded] = useState(true);

  const setMonthlyIncome = (income: number) => {
    setMonthlyIncomeState(prev => {
      try {
        console.log('Saving monthly income:', income);
        localStorage.setItem(STORAGE_KEY, income.toString());
        return income;
      } catch (error) {
        console.error('Error saving monthly income:', error);
        return prev;
      }
    });
  };

  return {
    monthlyIncome,
    setMonthlyIncome,
    isLoaded
  };
};