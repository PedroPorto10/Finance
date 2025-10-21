/**
 * App Initializer
 *
 * Centralized initialization logic for app settings and data.
 * Loads all settings on app start and provides a single source of truth.
 */

import { settingsService } from './settingsService';
import type { BudgetAlert } from '../types/budget';
import type { SavingsGoal } from '../types/savings';
import type { CreditCard } from '../types/creditCard';
import type { Investment } from '../types/investment';

export interface AppSettings {
  budgetAlerts: BudgetAlert[];
  savingsGoals: SavingsGoal[];
  creditCards: CreditCard[];
  investments: Investment[];
  isInitialized: boolean;
}

class AppInitializer {
  private static instance: AppInitializer;
  private settings: AppSettings | null = null;
  private initPromise: Promise<AppSettings> | null = null;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * Initialize all app settings on startup
   * This should be called once when the app starts
   */
  async initialize(): Promise<AppSettings> {
    // If already initializing, return the existing promise
    if (this.initPromise) {
      return this.initPromise;
    }

    // If already initialized, return cached settings
    if (this.settings?.isInitialized) {
      return this.settings;
    }

    // Start initialization
    this.initPromise = this.loadAllSettings();

    try {
      this.settings = await this.initPromise;
      return this.settings;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Load all settings from storage
   */
  private async loadAllSettings(): Promise<AppSettings> {
    console.log('AppInitializer: Loading all settings...');

    try {
      const [budgetAlerts, savingsGoals, creditCards, investments] = await Promise.all([
        settingsService.getBudgetAlerts(),
        settingsService.getSavingsGoals(),
        settingsService.getCreditCards(),
        settingsService.getInvestments(),
      ]);

      console.log('AppInitializer: Loaded settings:', {
        budgetAlerts: budgetAlerts.length,
        savingsGoals: savingsGoals.length,
        creditCards: creditCards.length,
        investments: investments.length,
      });

      return {
        budgetAlerts,
        savingsGoals,
        creditCards,
        investments,
        isInitialized: true,
      };
    } catch (error) {
      console.error('AppInitializer: Error loading settings:', error);

      // Return empty defaults on error
      return {
        budgetAlerts: [],
        savingsGoals: [],
        creditCards: [],
        investments: [],
        isInitialized: true,
      };
    }
  }

  /**
   * Get current settings (must be initialized first)
   */
  getSettings(): AppSettings | null {
    return this.settings;
  }

  /**
   * Update budget alerts in memory and storage
   */
  async updateBudgetAlerts(budgetAlerts: BudgetAlert[]): Promise<void> {
    if (!this.settings) {
      throw new Error('AppInitializer not initialized');
    }

    await settingsService.saveBudgetAlerts(budgetAlerts);
    this.settings.budgetAlerts = budgetAlerts;
    console.log('AppInitializer: Updated budget alerts:', budgetAlerts.length);
  }

  /**
   * Update savings goals in memory and storage
   */
  async updateSavingsGoals(savingsGoals: SavingsGoal[]): Promise<void> {
    if (!this.settings) {
      throw new Error('AppInitializer not initialized');
    }

    await settingsService.saveSavingsGoals(savingsGoals);
    this.settings.savingsGoals = savingsGoals;
    console.log('AppInitializer: Updated savings goals:', savingsGoals.length);
  }

  /**
   * Update credit cards in memory and storage
   */
  async updateCreditCards(creditCards: CreditCard[]): Promise<void> {
    if (!this.settings) {
      throw new Error('AppInitializer not initialized');
    }

    await settingsService.saveCreditCards(creditCards);
    this.settings.creditCards = creditCards;
    console.log('AppInitializer: Updated credit cards:', creditCards.length);
  }

  /**
   * Update investments in memory and storage
   */
  async updateInvestments(investments: Investment[]): Promise<void> {
    if (!this.settings) {
      throw new Error('AppInitializer not initialized');
    }

    await settingsService.setInvestments(investments);
    this.settings.investments = investments;
    console.log('AppInitializer: Updated investments:', investments.length);
  }

  /**
   * Reset all settings
   */
  reset(): void {
    this.settings = null;
    this.initPromise = null;
  }

  /**
   * Check if app is initialized
   */
  isInitialized(): boolean {
    return this.settings?.isInitialized ?? false;
  }
}

// Export singleton instance
export const appInitializer = AppInitializer.getInstance();
