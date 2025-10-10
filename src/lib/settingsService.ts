/**
 * Settings Service
 *
 * Business logic layer for managing app settings.
 * Uses SimpleStorage which internally uses Capacitor Preferences.
 */

import { SimpleStorage } from './simpleStorage';
import type { BudgetAlert } from '../types/budget';
import type { SavingsGoal } from '../types/savings';
import type { CreditCard } from '../types/creditCard';

// Storage keys
const STORAGE_KEYS = {
  BUDGET_ALERTS: 'budget_alerts',
  SAVINGS_GOALS: 'savings_goals',
  CREDIT_CARDS: 'credit_cards',
} as const;

class SettingsService {
  // ==================== Budget Alerts ====================

  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    return await SimpleStorage.getObjectAsync<BudgetAlert[]>(STORAGE_KEYS.BUDGET_ALERTS, []);
  }

  async saveBudgetAlerts(alerts: BudgetAlert[]): Promise<void> {
    await SimpleStorage.setObjectAsync(STORAGE_KEYS.BUDGET_ALERTS, alerts);
  }

  async addBudgetAlert(alert: Omit<BudgetAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<BudgetAlert> {
    const alerts = await this.getBudgetAlerts();
    const newAlert: BudgetAlert = {
      ...alert,
      id: `budget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    alerts.push(newAlert);
    await this.saveBudgetAlerts(alerts);
    return newAlert;
  }

  async updateBudgetAlert(id: string, updates: Partial<Omit<BudgetAlert, 'id' | 'createdAt'>>): Promise<BudgetAlert | null> {
    const alerts = await this.getBudgetAlerts();
    const index = alerts.findIndex(a => a.id === id);

    if (index === -1) {
      return null;
    }

    const updatedAlert = {
      ...alerts[index],
      ...updates,
      updatedAt: new Date(),
    };
    alerts[index] = updatedAlert;
    await this.saveBudgetAlerts(alerts);
    return updatedAlert;
  }

  async deleteBudgetAlert(id: string): Promise<boolean> {
    const alerts = await this.getBudgetAlerts();
    const filtered = alerts.filter(a => a.id !== id);

    if (filtered.length === alerts.length) {
      return false; // Not found
    }

    await this.saveBudgetAlerts(filtered);
    return true;
  }

  async toggleBudgetAlert(id: string): Promise<boolean> {
    const alerts = await this.getBudgetAlerts();
    const alert = alerts.find(a => a.id === id);

    if (!alert) {
      return false;
    }

    alert.isActive = !alert.isActive;
    alert.updatedAt = new Date();
    await this.saveBudgetAlerts(alerts);
    return true;
  }

  // ==================== Savings Goals ====================

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    return await SimpleStorage.getObjectAsync<SavingsGoal[]>(STORAGE_KEYS.SAVINGS_GOALS, []);
  }

  async saveSavingsGoals(goals: SavingsGoal[]): Promise<void> {
    await SimpleStorage.setObjectAsync(STORAGE_KEYS.SAVINGS_GOALS, goals);
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavingsGoal> {
    const goals = await this.getSavingsGoals();
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    goals.push(newGoal);
    await this.saveSavingsGoals(goals);
    return newGoal;
  }

  async updateSavingsGoal(id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>): Promise<SavingsGoal | null> {
    const goals = await this.getSavingsGoals();
    const index = goals.findIndex(g => g.id === id);

    if (index === -1) {
      return null;
    }

    const updatedGoal = {
      ...goals[index],
      ...updates,
      updatedAt: new Date(),
    };
    goals[index] = updatedGoal;
    await this.saveSavingsGoals(goals);
    return updatedGoal;
  }

  async deleteSavingsGoal(id: string): Promise<boolean> {
    const goals = await this.getSavingsGoals();
    const filtered = goals.filter(g => g.id !== id);

    if (filtered.length === goals.length) {
      return false; // Not found
    }

    await this.saveSavingsGoals(filtered);
    return true;
  }

  async addContribution(goalId: string, amount: number): Promise<SavingsGoal | null> {
    const goals = await this.getSavingsGoals();
    const goal = goals.find(g => g.id === goalId);

    if (!goal) {
      return null;
    }

    goal.currentAmount += amount;
    goal.updatedAt = new Date();
    await this.saveSavingsGoals(goals);
    return goal;
  }

  // ==================== Credit Cards ====================

  async getCreditCards(): Promise<CreditCard[]> {
    return await SimpleStorage.getObjectAsync<CreditCard[]>(STORAGE_KEYS.CREDIT_CARDS, []);
  }

  async saveCreditCards(cards: CreditCard[]): Promise<void> {
    await SimpleStorage.setObjectAsync(STORAGE_KEYS.CREDIT_CARDS, cards);
  }

  async addCreditCard(card: Omit<CreditCard, 'id'>): Promise<CreditCard> {
    const cards = await this.getCreditCards();
    const newCard: CreditCard = {
      ...card,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    cards.push(newCard);
    await this.saveCreditCards(cards);
    return newCard;
  }

  async updateCreditCard(id: string, updates: Partial<Omit<CreditCard, 'id'>>): Promise<CreditCard | null> {
    const cards = await this.getCreditCards();
    const index = cards.findIndex(c => c.id === id);

    if (index === -1) {
      return null;
    }

    const updatedCard = {
      ...cards[index],
      ...updates,
    };
    cards[index] = updatedCard;
    await this.saveCreditCards(cards);
    return updatedCard;
  }

  async deleteCreditCard(id: string): Promise<boolean> {
    const cards = await this.getCreditCards();
    const filtered = cards.filter(c => c.id !== id);

    if (filtered.length === cards.length) {
      return false; // Not found
    }

    await this.saveCreditCards(filtered);
    return true;
  }

  async toggleCreditCard(id: string): Promise<boolean> {
    const cards = await this.getCreditCards();
    const card = cards.find(c => c.id === id);

    if (!card) {
      return false;
    }

    card.enabled = !card.enabled;
    await this.saveCreditCards(cards);
    return true;
  }

  async updateCardBalance(id: string, balance: number, usage: number): Promise<CreditCard | null> {
    return await this.updateCreditCard(id, {
      currentBalance: balance,
      currentUsage: usage,
    });
  }

  // ==================== Utility Methods ====================

  async clearAllSettings(): Promise<void> {
    SimpleStorage.remove(STORAGE_KEYS.BUDGET_ALERTS);
    SimpleStorage.remove(STORAGE_KEYS.SAVINGS_GOALS);
    SimpleStorage.remove(STORAGE_KEYS.CREDIT_CARDS);
  }

  async exportSettings(): Promise<string> {
    const settings = {
      budgetAlerts: await this.getBudgetAlerts(),
      savingsGoals: await this.getSavingsGoals(),
      creditCards: await this.getCreditCards(),
      exportDate: new Date(),
    };
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(jsonData: string): Promise<boolean> {
    try {
      const settings = JSON.parse(jsonData);

      if (settings.budgetAlerts) {
        await this.saveBudgetAlerts(settings.budgetAlerts);
      }
      if (settings.savingsGoals) {
        await this.saveSavingsGoals(settings.savingsGoals);
      }
      if (settings.creditCards) {
        await this.saveCreditCards(settings.creditCards);
      }

      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
