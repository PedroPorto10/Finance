import { Preferences } from '@capacitor/preferences';

/**
 * Unified storage utility that works consistently across all platforms
 * Uses Capacitor Preferences for mobile and localStorage for web
 * Handles all errors gracefully and provides consistent API
 */
export class UnifiedStorage {
  private static isCapacitorAvailable(): boolean {
    try {
      // Check if we're in a Capacitor environment
      return typeof window !== 'undefined' &&
             (window as { Capacitor?: unknown }).Capacitor !== undefined &&
             typeof Preferences !== 'undefined';
    } catch (error) {
      console.error('UnifiedStorage: Error checking Capacitor availability:', error);
      return false;
    }
  }

  /**
   * Get a value from storage
   */
  static async get(key: string): Promise<string | null> {
    try {
      const isCapacitor = this.isCapacitorAvailable();
      console.log(`UnifiedStorage.get(${key}) using ${isCapacitor ? 'Capacitor' : 'localStorage'}`);

      if (isCapacitor) {
        const { value } = await Preferences.get({ key });
        console.log(`UnifiedStorage.get(${key}) result:`, value ? 'found' : 'null');
        return value;
      } else {
        const value = localStorage.getItem(key);
        console.log(`UnifiedStorage.get(${key}) result:`, value ? 'found' : 'null');
        return value;
      }
    } catch (error) {
      console.error(`UnifiedStorage.get(${key}) error:`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  static async set(key: string, value: string): Promise<boolean> {
    try {
      const isCapacitor = this.isCapacitorAvailable();
      console.log(`UnifiedStorage.set(${key}) using ${isCapacitor ? 'Capacitor' : 'localStorage'}`);

      if (isCapacitor) {
        await Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
      console.log(`UnifiedStorage.set(${key}) success`);
      return true;
    } catch (error) {
      console.error(`UnifiedStorage.set(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Remove a value from storage
   */
  static async remove(key: string): Promise<boolean> {
    try {
      if (this.isCapacitorAvailable()) {
        await Preferences.remove({ key });
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`UnifiedStorage.remove(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Get and parse JSON object
   */
  static async getObject<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await this.get(key);
      if (value === null) return defaultValue;

      const parsed = JSON.parse(value);
      return { ...defaultValue, ...parsed };
    } catch (error) {
      console.error(`UnifiedStorage.getObject(${key}) error:`, error);
      // Clean up corrupted data
      await this.remove(key);
      return defaultValue;
    }
  }

  /**
   * Set JSON object to storage
   */
  static async setObject<T>(key: string, value: T): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`UnifiedStorage.setObject(${key}) error:`, error);
      return false;
    }
  }

  /**
   * Synchronous versions for compatibility (web only)
   */
  static getSync(key: string): string | null {
    if (this.isCapacitorAvailable()) {
      console.warn('getSync not recommended in Capacitor environment');
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`UnifiedStorage.getSync(${key}) error:`, error);
      return null;
    }
  }

  static setSyncObject<T>(key: string, value: T): boolean {
    if (this.isCapacitorAvailable()) {
      console.warn('setSyncObject not recommended in Capacitor environment');
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`UnifiedStorage.setSyncObject(${key}) error:`, error);
      return false;
    }
  }

  static getSyncObject<T>(key: string, defaultValue: T): T {
    if (this.isCapacitorAvailable()) {
      console.warn('getSyncObject not recommended in Capacitor environment');
      return defaultValue;
    }
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      const parsed = JSON.parse(item);
      return { ...defaultValue, ...parsed };
    } catch (error) {
      console.error(`UnifiedStorage.getSyncObject(${key}) error:`, error);
      // Clean up corrupted data
      try {
        localStorage.removeItem(key);
      } catch (cleanupError) {
        console.error('UnifiedStorage: Error during cleanup:', cleanupError);
      }
      return defaultValue;
    }
  }

  /**
   * Migrate data from old storage keys
   */
  static async migrateFromLocalStorage(): Promise<void> {
    if (this.isCapacitorAvailable()) {
      console.log('Starting localStorage to Capacitor migration...');

      const keysToMigrate = [
        'theme-settings',
        'security-settings',
        'app-lock-state',
        'user-pin-hash',
        'finance-transactions',
        'finance-income-sources',
        'finance-monthly-income',
        'finance-investment-preferences',
        'finance-budget-alerts',
        'finance-savings-goals',
        'finance-bill-reminders',
      ];

      let migrated = 0;

      for (const key of keysToMigrate) {
        try {
          // Check if already exists in Capacitor storage
          const existing = await Preferences.get({ key });
          if (existing.value) continue; // Already migrated

          // Get from localStorage
          const localValue = localStorage.getItem(key);
          if (localValue) {
            await Preferences.set({ key, value: localValue });
            localStorage.removeItem(key); // Clean up old data
            migrated++;
          }
        } catch (error) {
          console.error(`Migration failed for key ${key}:`, error);
        }
      }

      if (migrated > 0) {
        console.log(`Migrated ${migrated} configuration items to Capacitor storage`);
      }
    }
  }
}