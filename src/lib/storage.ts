import { Preferences } from '@capacitor/preferences';

/**
 * Storage utility that uses Capacitor Preferences for mobile apps
 * and falls back to localStorage for web development
 */
export class Storage {
  /**
   * Get a value from storage
   */
  static async get(key: string): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error('Storage get error:', error);
      // Fallback to localStorage for web development
      try {
        return localStorage.getItem(key);
      } catch (fallbackError) {
        console.error('localStorage fallback error:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Set a value in storage
   */
  static async set(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
      console.log(`Storage set: ${key} = ${value}`);
    } catch (error) {
      console.error('Storage set error:', error);
      // Fallback to localStorage for web development
      try {
        localStorage.setItem(key, value);
        console.log(`localStorage fallback set: ${key} = ${value}`);
      } catch (fallbackError) {
        console.error('localStorage fallback set error:', fallbackError);
      }
    }
  }

  /**
   * Remove a value from storage
   */
  static async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error('Storage remove error:', error);
      // Fallback to localStorage for web development
      try {
        localStorage.removeItem(key);
      } catch (fallbackError) {
        console.error('localStorage fallback remove error:', fallbackError);
      }
    }
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      // Fallback to localStorage for web development
      try {
        localStorage.clear();
      } catch (fallbackError) {
        console.error('localStorage fallback clear error:', fallbackError);
      }
    }
  }

  /**
   * Get all keys in storage
   */
  static async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Storage keys error:', error);
      // Fallback to localStorage for web development
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) keys.push(key);
        }
        return keys;
      } catch (fallbackError) {
        console.error('localStorage fallback keys error:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Convenience method to get and parse JSON
   */
  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Storage getObject error:', error);
      return null;
    }
  }

  /**
   * Convenience method to set JSON object
   */
  static async setObject(key: string, value: unknown): Promise<void> {
    try {
      await this.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage setObject error:', error);
    }
  }
}