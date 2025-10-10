export interface CategoryInsight {
  category: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  topMerchants: MerchantInsight[];
  monthlyBreakdown: MonthlySpending[];
}

export interface MerchantInsight {
  contact: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
  lastTransaction: Date;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
}

export interface MonthlySpending {
  month: string;
  year: number;
  amount: number;
  transactionCount: number;
}

export interface SpendingPattern {
  dayOfWeek: string;
  hour: number;
  amount: number;
  frequency: number;
}

export interface FinancialHealth {
  score: number; // 0-100
  factors: {
    savingsRate: number;
    spendingConsistency: number;
    categoryBalance: number;
    emergencyFund: number;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TransactionFilter {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  categories?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
  type?: 'received' | 'sent' | 'all';
  contact?: string;
  description?: string;
  sortBy?: 'date' | 'amount' | 'contact';
  sortOrder?: 'asc' | 'desc';
}