import { useState, useEffect, useCallback } from 'react';
import { ThemeSettings, ThemeColors } from '@/types/theme';
import { SimpleStorage } from '@/lib/simpleStorage';

const THEME_STORAGE_KEY = 'theme-settings';

const defaultThemeSettings: ThemeSettings = {
  mode: 'light',
  accentColor: '#3b82f6',
  fontSize: 'medium',
  reducedMotion: false,
};

const lightTheme: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const darkTheme: ThemeColors = {
  primary: '#60a5fa',
  secondary: '#94a3b8',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
};

export const useTheme = () => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(lightTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme settings on mount
  useEffect(() => {
    let mounted = true;

    const loadThemeSettings = async () => {
      console.log('useTheme: Loading theme settings...');
      const settings = await SimpleStorage.getObjectAsync(THEME_STORAGE_KEY, defaultThemeSettings);

      if (mounted) {
        // If mode is 'system', force it to 'light' to prevent automatic activation
        if (settings.mode === 'system') {
          settings.mode = 'light';
          await SimpleStorage.setObjectAsync(THEME_STORAGE_KEY, settings);
        }

        console.log('useTheme: Loaded settings:', settings);
        setThemeSettings(settings);
        setIsInitialized(true);
      }
    };

    loadThemeSettings();

    return () => {
      mounted = false;
    };
  }, []);

  // Persist theme settings
  const persistThemeSettings = useCallback(async (settings: ThemeSettings) => {
    console.log('useTheme: Saving theme settings:', settings);
    const success = await SimpleStorage.setObjectAsync(THEME_STORAGE_KEY, settings);
    if (!success) {
      console.error('useTheme: Failed to save theme settings');
    }
  }, []);

  // Detect system theme preference
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // Update theme based on settings (only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    console.log('useTheme: Applying theme with settings:', themeSettings);

    let shouldUseDark = false;

    switch (themeSettings.mode) {
      case 'dark':
        shouldUseDark = true;
        break;
      case 'light':
        shouldUseDark = false;
        break;
      case 'system':
      default:
        shouldUseDark = getSystemTheme();
        break;
    }

    console.log('useTheme: Setting dark mode to:', shouldUseDark);
    setIsDarkMode(shouldUseDark);

    // Update CSS custom properties
    const root = document.documentElement;
    const theme = shouldUseDark ? darkTheme : lightTheme;

    // Apply colors with accent color override
    const accentedTheme = {
      ...theme,
      primary: themeSettings.accentColor,
    };

    Object.entries(accentedTheme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--font-size-base', fontSizeMap[themeSettings.fontSize]);

    // Apply reduced motion
    if (themeSettings.reducedMotion) {
      root.style.setProperty('--motion-reduce', 'none');
    } else {
      root.style.removeProperty('--motion-reduce');
    }

    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(shouldUseDark ? 'theme-dark' : 'theme-light');

    // Apply dark class for Tailwind
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setColors(accentedTheme);
  }, [isInitialized, themeSettings, getSystemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeSettings.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setThemeSettings(prev => ({ ...prev })); // Trigger re-evaluation
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeSettings.mode]);

  // Update theme mode
  const setThemeMode = useCallback(async (mode: ThemeSettings['mode']) => {
    const updated = { ...themeSettings, mode };
    setThemeSettings(updated);
    await persistThemeSettings(updated);
  }, [themeSettings, persistThemeSettings]);

  // Update accent color
  const setAccentColor = useCallback(async (color: string) => {
    const updated = { ...themeSettings, accentColor: color };
    setThemeSettings(updated);
    await persistThemeSettings(updated);
  }, [themeSettings, persistThemeSettings]);

  // Update font size
  const setFontSize = useCallback(async (fontSize: ThemeSettings['fontSize']) => {
    const updated = { ...themeSettings, fontSize };
    setThemeSettings(updated);
    await persistThemeSettings(updated);
  }, [themeSettings, persistThemeSettings]);

  // Toggle reduced motion
  const setReducedMotion = useCallback(async (reducedMotion: boolean) => {
    const updated = { ...themeSettings, reducedMotion };
    setThemeSettings(updated);
    await persistThemeSettings(updated);
  }, [themeSettings, persistThemeSettings]);

  // Toggle dark mode (convenience function)
  const toggleDarkMode = useCallback(async () => {
    const newMode: ThemeSettings['mode'] = isDarkMode ? 'light' : 'dark';
    const updated = { ...themeSettings, mode: newMode };
    setThemeSettings(updated);
    await persistThemeSettings(updated);
  }, [isDarkMode, themeSettings, persistThemeSettings]);

  // Get current theme colors
  const getCurrentTheme = useCallback(() => {
    return isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Predefined accent colors
  const accentColorOptions = [
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Laranja', value: '#f59e0b' },
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Ciano', value: '#06b6d4' },
    { name: 'Indigo', value: '#6366f1' },
  ];

  return {
    themeSettings,
    isDarkMode,
    colors,
    setThemeMode,
    setAccentColor,
    setFontSize,
    setReducedMotion,
    toggleDarkMode,
    getCurrentTheme,
    accentColorOptions,
    getSystemTheme,
  };
};