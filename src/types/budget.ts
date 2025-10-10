export interface BudgetAlert {
  id: string;
  category: 'Alimentação' | 'Laser' | 'Contas' | 'Transporte' | 'Outros';
  limit: number;
  period: 'monthly' | 'weekly' | 'daily';
  threshold: number; // Percentage (e.g., 80 for 80%)
  isActive: boolean;
  notifications: {
    push: boolean;
    email: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  threshold: number;
}

export interface BudgetPeriod {
  startDate: Date;
  endDate: Date;
  type: 'monthly' | 'weekly' | 'daily';
}