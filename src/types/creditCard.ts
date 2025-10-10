export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  last4Digits: string;
  limit: number;
  currentBalance: number;
  currentUsage: number;
  dueDate: number; // Day of month
  closingDate: number; // Day of month
  isActive: boolean;
  enabled: boolean;
  notificationPatterns: string[]; // Patterns to match in notifications
  color: string;
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;
  amount: number;
  date: Date;
  merchant: string;
  category?: string;
  description?: string;
}

export interface CreditCardSpending {
  cardId: string;
  totalSpent: number;
  availableCredit: number;
  utilizationPercentage: number;
  transactionCount: number;
  categories: { [category: string]: number };
}

export interface CreditCardStatement {
  id: string;
  cardId: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  dueDate: Date;
  minimumPayment: number;
  transactions: CreditCardTransaction[];
}