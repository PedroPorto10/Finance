/**
 * Safe localStorage wrapper that handles errors gracefully
 * Prevents app crashes from corrupted localStorage data
 */
export class SafeLocalStorage {
  /**
   * Safely get an item from localStorage
   */
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`SafeLocalStorage.getItem(${key}) error:`, error);
      return null;
    }
  }

  /**
   * Safely set an item in localStorage
   */
  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`SafeLocalStorage.setItem(${key}) error:`, error);
    }
  }

  /**
   * Safely remove an item from localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`SafeLocalStorage.removeItem(${key}) error:`, error);
    }
  }

  /**
   * Safely parse JSON from localStorage
   */
  static getJSON<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;

      const parsed = JSON.parse(item);
      return parsed;
    } catch (error) {
      console.error(`SafeLocalStorage.getJSON(${key}) error:`, error);
      // Clear corrupted data and return default
      this.removeItem(key);
      return defaultValue;
    }
  }

  /**
   * Safely set JSON to localStorage
   */
  static setJSON(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`SafeLocalStorage.setJSON(${key}) error:`, error);
    }
  }

  /**
   * Clear all localStorage data (use with caution)
   */
  static clearAll(): void {
    try {
      localStorage.clear();
      console.log('localStorage cleared successfully');
    } catch (error) {
      console.error('SafeLocalStorage.clearAll() error:', error);
    }
  }

  /**
   * Migrate from direct localStorage usage to safe wrapper
   * This will attempt to clean up any corrupted data
   */
  static cleanup(): void {
    console.log('Running localStorage cleanup...');

    // List of known keys that might be corrupted
    const knownKeys = [
      'finance-transactions',
      'finance-income-sources',
      'finance-monthly-income',
      'finance-investment-preferences',
      'finance-budget-alerts',
      'finance-savings-goals',
      'finance-bill-reminders',
      'finance-security-settings',
      'finance-theme-settings',
      'user-pin-hash'
    ];

    let cleanedUp = 0;

    knownKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // Try to parse JSON to verify it's valid
          JSON.parse(value);
        }
      } catch (error) {
        console.warn(`Cleaning up corrupted localStorage key: ${key}`);
        localStorage.removeItem(key);
        cleanedUp++;
      }
    });

    if (cleanedUp > 0) {
      console.log(`Cleaned up ${cleanedUp} corrupted localStorage entries`);
    } else {
      console.log('No corrupted localStorage entries found');
    }
  }
}