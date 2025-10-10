import { SimpleStorage } from './simpleStorage';

// Simple key-value settings manager
export class AppSettings {
  // Settings keys
  private static readonly KEYS = {
    BUDGET_ALERTS: 'app-budget-alerts',
    BILL_REMINDERS: 'app-bill-reminders',
    SAVINGS_GOALS: 'app-savings-goals',
    CREDIT_CARDS: 'app-credit-cards',
    INVESTMENTS: 'app-investments'
  } as const;

  // Generic get/set methods for key-value storage
  static async getValue<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await SimpleStorage.getObjectAsync(key, defaultValue);
      console.log(`AppSettings: Retrieved ${key}:`, value);

      // Ensure arrays are properly returned as arrays
      if (Array.isArray(defaultValue) && !Array.isArray(value)) {
        console.warn(`AppSettings: Expected array for ${key}, got:`, typeof value, value);
        return defaultValue;
      }

      return value || defaultValue;
    } catch (error) {
      console.error(`AppSettings: Error retrieving ${key}:`, error);
      return defaultValue;
    }
  }

  static async setValue<T>(key: string, value: T): Promise<boolean> {
    try {
      console.log(`AppSettings: Saving ${key}:`, value);
      const success = await SimpleStorage.setObjectAsync(key, value);
      console.log(`AppSettings: Save result for ${key}:`, success);
      return success;
    } catch (error) {
      console.error(`AppSettings: Error saving ${key}:`, error);
      return false;
    }
  }

  // Specific setting getters/setters
  static async getBudgetAlerts(): Promise<any[]> {
    const result = await this.getValue(this.KEYS.BUDGET_ALERTS, []);
    return Array.isArray(result) ? result : [];
  }

  static async setBudgetAlerts(alerts: any[]): Promise<boolean> {
    if (!Array.isArray(alerts)) {
      console.error('AppSettings: setBudgetAlerts called with non-array:', alerts);
      return false;
    }
    return this.setValue(this.KEYS.BUDGET_ALERTS, alerts);
  }

  static async getBillReminders(): Promise<any[]> {
    const result = await this.getValue(this.KEYS.BILL_REMINDERS, []);
    return Array.isArray(result) ? result : [];
  }

  static async setBillReminders(reminders: any[]): Promise<boolean> {
    if (!Array.isArray(reminders)) {
      console.error('AppSettings: setBillReminders called with non-array:', reminders);
      return false;
    }
    return this.setValue(this.KEYS.BILL_REMINDERS, reminders);
  }

  static async getSavingsGoals(): Promise<any[]> {
    const result = await this.getValue(this.KEYS.SAVINGS_GOALS, []);
    return Array.isArray(result) ? result : [];
  }

  static async setSavingsGoals(goals: any[]): Promise<boolean> {
    if (!Array.isArray(goals)) {
      console.error('AppSettings: setSavingsGoals called with non-array:', goals);
      return false;
    }
    return this.setValue(this.KEYS.SAVINGS_GOALS, goals);
  }

  static async getCreditCards(): Promise<any[]> {
    const result = await this.getValue(this.KEYS.CREDIT_CARDS, []);
    return Array.isArray(result) ? result : [];
  }

  static async setCreditCards(cards: any[]): Promise<boolean> {
    if (!Array.isArray(cards)) {
      console.error('AppSettings: setCreditCards called with non-array:', cards);
      return false;
    }
    return this.setValue(this.KEYS.CREDIT_CARDS, cards);
  }

  static async getInvestments(): Promise<any[]> {
    const result = await this.getValue(this.KEYS.INVESTMENTS, []);
    return Array.isArray(result) ? result : [];
  }

  static async setInvestments(investments: any[]): Promise<boolean> {
    if (!Array.isArray(investments)) {
      console.error('AppSettings: setInvestments called with non-array:', investments);
      return false;
    }
    return this.setValue(this.KEYS.INVESTMENTS, investments);
  }

  // Helper method to add item to an array setting
  static async addToSetting<T>(settingKey: string, item: T, generateId?: () => string): Promise<T | null> {
    try {
      const currentItems = await this.getValue<T[]>(settingKey, []);
      const newItem = generateId ? { ...item, id: generateId() } : item;
      const updatedItems = [...currentItems, newItem];

      const success = await this.setValue(settingKey, updatedItems);
      return success ? newItem : null;
    } catch (error) {
      console.error(`AppSettings: Error adding to ${settingKey}:`, error);
      return null;
    }
  }

  // Helper method to update item in an array setting
  static async updateInSetting<T extends { id: string }>(
    settingKey: string,
    itemId: string,
    updates: Partial<T>
  ): Promise<boolean> {
    try {
      const currentItems = await this.getValue<T[]>(settingKey, []);
      const updatedItems = currentItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      return await this.setValue(settingKey, updatedItems);
    } catch (error) {
      console.error(`AppSettings: Error updating in ${settingKey}:`, error);
      return false;
    }
  }

  // Helper method to delete item from an array setting
  static async deleteFromSetting<T extends { id: string }>(
    settingKey: string,
    itemId: string
  ): Promise<boolean> {
    try {
      const currentItems = await this.getValue<T[]>(settingKey, []);
      const updatedItems = currentItems.filter(item => item.id !== itemId);

      return await this.setValue(settingKey, updatedItems);
    } catch (error) {
      console.error(`AppSettings: Error deleting from ${settingKey}:`, error);
      return false;
    }
  }

  // Export all settings for debugging
  static async exportAllSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    for (const [name, key] of Object.entries(this.KEYS)) {
      settings[name] = await this.getValue(key, []);
    }

    return settings;
  }
}