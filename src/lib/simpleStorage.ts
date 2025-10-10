import { Preferences } from '@capacitor/preferences';

/**
 * Simple Storage Utility
 * Provides a consistent interface for all app configuration
 * Uses Capacitor Preferences for mobile and localStorage for web
 * Handles initialization, persistence, and cross-platform compatibility
 */

export class SimpleStorage {
  /**
   * Check if we're in a Capacitor environment
   */
  private static isCapacitorAvailable(): boolean {
    try {
      // First check if we have the Capacitor runtime (not just the import)
      if (typeof window === 'undefined') return false;

      const windowWithCapacitor = window as { Capacitor?: { isNativePlatform?: () => boolean } };
      const hasCapacitorRuntime = windowWithCapacitor.Capacitor !== undefined;

      // Check if we have the Capacitor runtime and it's actually native
      if (hasCapacitorRuntime) {
        // Check if this is a native platform, not just web with Capacitor
        const isNative = windowWithCapacitor.Capacitor?.isNativePlatform?.() ?? false;
        console.log('SimpleStorage: Capacitor runtime found, isNative:', isNative);
        return isNative;
      }

      return false;
    } catch (error) {
      console.error('SimpleStorage: Error checking Capacitor availability:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== null;
    } catch (error) {
      console.error('SimpleStorage: Error checking localStorage availability:', error);
      return false;
    }
  }

  /**
   * Get and parse JSON object (async version for Capacitor)
   */
  static async getObjectAsync<T>(key: string, defaultValue: T): Promise<T> {
    const isCapacitor = this.isCapacitorAvailable();
    const isLocalStorage = this.isLocalStorageAvailable();
    console.log(`SimpleStorage.getObjectAsync: key=${key}, capacitor=${isCapacitor}, localStorage=${isLocalStorage}`);

    if (isCapacitor) {
      try {
        console.log(`SimpleStorage: Using Capacitor Preferences for ${key}`);
        const { value } = await Preferences.get({ key });
        console.log(`SimpleStorage: Capacitor returned for ${key}:`, value);
        if (value === null) {
          console.log(`SimpleStorage: No value found in Capacitor for ${key}, returning default`);
          return defaultValue;
        }
        const parsed = JSON.parse(value);
        const result = { ...defaultValue, ...parsed };
        console.log(`SimpleStorage: Loaded from Capacitor ${key}:`, result);
        return result;
      } catch (error) {
        console.error(`SimpleStorage: Error loading ${key} from Capacitor:`, error);
        await Preferences.remove({ key }); // Clean up corrupted data
        return defaultValue;
      }
    } else if (isLocalStorage) {
      try {
        console.log(`SimpleStorage: Using localStorage for ${key}`);
        const item = localStorage.getItem(key);
        console.log(`SimpleStorage: localStorage returned for ${key}:`, item);
        if (item === null) {
          console.log(`SimpleStorage: No value found in localStorage for ${key}, returning default`);
          return defaultValue;
        }
        const parsed = JSON.parse(item);
        const result = { ...defaultValue, ...parsed };
        console.log(`SimpleStorage: Loaded from localStorage ${key}:`, result);
        return result;
      } catch (error) {
        console.error(`SimpleStorage: Error loading ${key} from localStorage:`, error);
        try {
          localStorage.removeItem(key);
        } catch (cleanupError) {
          console.error('SimpleStorage: Error during cleanup:', cleanupError);
        }
        return defaultValue;
      }
    } else {
      console.warn(`SimpleStorage: No storage available, returning default for ${key}`);
      return defaultValue;
    }
  }

  /**
   * Get and parse JSON object (sync version for backwards compatibility)
   */
  static getObject<T>(key: string, defaultValue: T): T {
    // If we're in Capacitor, we can't do sync operations, return default and warn
    if (this.isCapacitorAvailable()) {
      console.warn(`SimpleStorage: Cannot perform sync operation in Capacitor environment for ${key}, returning default`);
      return defaultValue;
    }

    if (!this.isLocalStorageAvailable()) {
      console.warn(`SimpleStorage: localStorage not available, returning default for ${key}`);
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      const parsed = JSON.parse(item);
      return { ...defaultValue, ...parsed };
    } catch (error) {
      console.error(`SimpleStorage: Error loading ${key}:`, error);
      try {
        localStorage.removeItem(key);
      } catch (cleanupError) {
        console.error('SimpleStorage: Error during cleanup:', cleanupError);
      }
      return defaultValue;
    }
  }

  /**
   * Set JSON object (async version for Capacitor)
   */
  static async setObjectAsync<T>(key: string, value: T): Promise<boolean> {
    const isCapacitor = this.isCapacitorAvailable();
    const isLocalStorage = this.isLocalStorageAvailable();
    console.log(`SimpleStorage.setObjectAsync: key=${key}, capacitor=${isCapacitor}, localStorage=${isLocalStorage}`);
    console.log(`SimpleStorage: Saving value for ${key}:`, value);

    if (isCapacitor) {
      try {
        console.log(`SimpleStorage: Using Capacitor Preferences to save ${key}`);
        const serialized = JSON.stringify(value);
        await Preferences.set({ key, value: serialized });
        console.log(`SimpleStorage: Successfully saved to Capacitor ${key}`);
        return true;
      } catch (error) {
        console.error(`SimpleStorage: Error saving ${key} to Capacitor:`, error);
        return false;
      }
    } else if (isLocalStorage) {
      try {
        console.log(`SimpleStorage: Using localStorage to save ${key}`);
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        console.log(`SimpleStorage: Successfully saved to localStorage ${key}`);
        return true;
      } catch (error) {
        console.error(`SimpleStorage: Error saving ${key} to localStorage:`, error);
        return false;
      }
    } else {
      console.warn(`SimpleStorage: No storage available, cannot save ${key}`);
      return false;
    }
  }

  /**
   * Set JSON object (sync version for backwards compatibility)
   */
  static setObject<T>(key: string, value: T): boolean {
    // If we're in Capacitor, we can't do sync operations, return false and warn
    if (this.isCapacitorAvailable()) {
      console.warn(`SimpleStorage: Cannot perform sync operation in Capacitor environment for ${key}`);
      return false;
    }

    if (!this.isLocalStorageAvailable()) {
      console.warn(`SimpleStorage: localStorage not available, cannot save ${key}`);
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`SimpleStorage: Error saving ${key}:`, error);
      return false;
    }
  }

  /**
   * Update partial configuration
   */
  static async updateObjectAsync<T>(key: string, updates: Partial<T>, defaultValue: T): Promise<boolean> {
    const current = await this.getObjectAsync(key, defaultValue);
    const updated = { ...current, ...updates };
    return this.setObjectAsync(key, updated);
  }

  static updateObject<T>(key: string, updates: Partial<T>, defaultValue: T): boolean {
    const current = this.getObject(key, defaultValue);
    const updated = { ...current, ...updates };
    return this.setObject(key, updated);
  }

  /**
   * Remove data from localStorage
   */
  static remove(key: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn(`SimpleStorage: localStorage not available, cannot remove ${key}`);
      return false;
    }

    try {
      localStorage.removeItem(key);
      console.log(`SimpleStorage: Removed ${key}`);
      return true;
    } catch (error) {
      console.error(`SimpleStorage: Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   */
  static exists(key: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('SimpleStorage: Error checking key existence:', error);
      return false;
    }
  }

  /**
   * Get all keys with a specific prefix
   */
  static getKeysWithPrefix(prefix: string): string[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.error('SimpleStorage: Error getting keys with prefix:', error);
      return [];
    }
  }

  /**
   * Export all configuration (for backup/debug)
   */
  static exportAll(): Record<string, unknown> {
    if (!this.isLocalStorageAvailable()) {
      return {};
    }

    const exported: Record<string, unknown> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              exported[key] = JSON.parse(value);
            }
          } catch {
            // Skip non-JSON values
            exported[key] = localStorage.getItem(key);
          }
        }
      }
    } catch (error) {
      console.error('SimpleStorage: Error exporting all data:', error);
    }

    return exported;
  }
}