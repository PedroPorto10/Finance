import { useState, useEffect, useCallback } from 'react';
import { ConfigManager } from '@/lib/configManager';

/**
 * Example hook demonstrating the working configuration approach
 * Use this pattern for any configuration that needs to persist
 */
export const useAppConfig = <T>(key: string, defaultValue: T) => {
  const [config, setConfig] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadedConfig = await ConfigManager.getConfig(key, defaultValue);

        if (mounted) {
          setConfig(loadedConfig);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load configuration');
          console.error(`Error loading config ${key}:`, err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      mounted = false;
    };
  }, [key, defaultValue]);

  // Update configuration
  const updateConfig = useCallback(async (updates: Partial<T>) => {
    try {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);

      const success = await ConfigManager.setConfig(key, newConfig);
      if (!success) {
        // Revert on failure
        setConfig(config);
        setError('Failed to save configuration');
      } else {
        setError(null);
      }
      return success;
    } catch (err) {
      // Revert on error
      setConfig(config);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      console.error(`Error updating config ${key}:`, err);
      return false;
    }
  }, [key, config]);

  // Set entire configuration
  const setFullConfig = useCallback(async (newConfig: T) => {
    try {
      setConfig(newConfig);

      const success = await ConfigManager.setConfig(key, newConfig);
      if (!success) {
        // Revert on failure
        setConfig(config);
        setError('Failed to save configuration');
      } else {
        setError(null);
      }
      return success;
    } catch (err) {
      // Revert on error
      setConfig(config);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      console.error(`Error setting config ${key}:`, err);
      return false;
    }
  }, [key, config]);

  return {
    config,
    loading,
    error,
    updateConfig,
    setConfig: setFullConfig,
  };
};

/**
 * Example usage in any component:
 *
 * interface MySettings {
 *   theme: 'light' | 'dark';
 *   language: string;
 *   notifications: boolean;
 * }
 *
 * const MyComponent = () => {
 *   const { config, loading, error, updateConfig } = useAppConfig<MySettings>('my-settings', {
 *     theme: 'light',
 *     language: 'en',
 *     notifications: true
 *   });
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *
 *   return (
 *     <div>
 *       <button onClick={() => updateConfig({ theme: config.theme === 'light' ? 'dark' : 'light' })}>
 *         Toggle Theme
 *       </button>
 *       Current theme: {config.theme}
 *     </div>
 *   );
 * };
 */