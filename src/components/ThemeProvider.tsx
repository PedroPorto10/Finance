import React, { createContext, useContext, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeContextType {
  themeSettings: any;
  isDarkMode: boolean;
  colors: any;
  setThemeMode: (mode: any) => Promise<void>;
  setAccentColor: (color: string) => Promise<void>;
  setFontSize: (fontSize: any) => Promise<void>;
  setReducedMotion: (reducedMotion: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  getCurrentTheme: () => string;
  accentColorOptions: any[];
  getSystemTheme: () => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeHook = useTheme();

  // Apply theme to document on app load and theme changes
  useEffect(() => {
    console.log('ThemeProvider: Initializing theme system');
  }, []);

  return (
    <ThemeContext.Provider value={themeHook}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};