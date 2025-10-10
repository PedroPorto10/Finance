import { UnifiedStorage } from './unifiedStorage';

/**
 * Configuration Manager
 * Provides a consistent interface for all app configuration
 * Handles initialization, persistence, and cross-platform compatibility
 */
export class ConfigManager {
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initialize the configuration system
   * Must be called before using any config methods
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    await this.initPromise;
  }

  private static async _initialize(): Promise<void> {
    console.log('Initializing configuration system...');

    try {
      // Migrate from localStorage if needed
      await UnifiedStorage.migrateFromLocalStorage();

      // Verify all config sections exist
      await this.ensureDefaultConfigs();

      this.isInitialized = true;
      console.log('Configuration system initialized successfully');
    } catch (error) {
      console.error('Configuration system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure all default configurations exist
   */
  private static async ensureDefaultConfigs(): Promise<void> {
    const defaults = {
      'theme-settings': {
        mode: 'light',
        accentColor: '#3b82f6',
        fontSize: 'medium',
        reducedMotion: false,
      },
      'security-settings': {
        pinEnabled: false,
        autoLockDuration: 5,
        requireAuthForExport: true,
        requireAuthForSettings: true,
        sessionTimeout: 15,
      },
      'app-lock-state': {
        isLocked: false,
        lastActivity: new Date().toISOString(),
        lockReason: 'timeout',
      },
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
      const existing = await UnifiedStorage.get(key);
      if (!existing) {
        await UnifiedStorage.setObject(key, defaultValue);
        console.log(`Created default config for: ${key}`);
      }
    }
  }

  /**
   * Get configuration object
   */
  static async getConfig<T>(key: string, defaultValue: T): Promise<T> {
    await this.initialize();
    return UnifiedStorage.getObject(key, defaultValue);
  }

  /**
   * Set configuration object
   */
  static async setConfig<T>(key: string, value: T): Promise<boolean> {
    await this.initialize();
    const success = await UnifiedStorage.setObject(key, value);
    if (success) {
      console.log(`Configuration saved: ${key}`);
    }
    return success;
  }

  /**
   * Update partial configuration
   */
  static async updateConfig<T>(key: string, updates: Partial<T>, defaultValue: T): Promise<boolean> {
    await this.initialize();

    const current = await this.getConfig(key, defaultValue);
    const updated = { ...current, ...updates };

    return this.setConfig(key, updated);
  }

  /**
   * Synchronous methods for backwards compatibility (web only)
   * Use these only when async is not possible
   */
  static getConfigSync<T>(key: string, defaultValue: T): T {
    if (!this.isInitialized) {
      console.warn('ConfigManager not initialized, using fallback sync method');
    }
    return UnifiedStorage.getSyncObject(key, defaultValue);
  }

  static setConfigSync<T>(key: string, value: T): boolean {
    if (!this.isInitialized) {
      console.warn('ConfigManager not initialized, using fallback sync method');
    }
    const success = UnifiedStorage.setSyncObject(key, value);
    if (success) {
      console.log(`Configuration saved (sync): ${key}`);
    }
    return success;
  }

  /**
   * Get initialization status
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Force re-initialization (use with caution)
   */
  static async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.initPromise = null;
    await this.initialize();
  }

  /**
   * Export all configuration (for backup/debug)
   */
  static async exportAllConfig(): Promise<Record<string, unknown>> {
    await this.initialize();

    const configKeys = [
      'theme-settings',
      'security-settings',
      'app-lock-state',
      'finance-transactions',
      'finance-income-sources',
      'finance-monthly-income',
      'finance-investment-preferences',
      'finance-budget-alerts',
      'finance-savings-goals',
      'finance-bill-reminders',
    ];

    const exported: Record<string, unknown> = {};

    for (const key of configKeys) {
      try {
        const value = await UnifiedStorage.get(key);
        if (value) {
          exported[key] = JSON.parse(value);
        }
      } catch (error) {
        console.error(`Failed to export config: ${key}`, error);
      }
    }

    return exported;
  }
}