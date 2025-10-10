export interface BillReminder {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  category: 'Contas' | 'Alimentação' | 'Transporte' | 'Laser' | 'Outros';
  frequency: 'monthly' | 'yearly' | 'weekly' | 'custom';
  customFrequencyDays?: number;
  dueDate: Date;
  nextDueDate: Date;
  reminderDays: number[]; // Days before due date to remind
  isActive: boolean;
  isRecurring: boolean;
  contactPattern?: string; // To match with transactions
  lastPaidDate?: Date;
  lastPaidAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillReminderNotification {
  id: string;
  reminderId: string;
  dueDate: Date;
  daysUntilDue: number;
  amount?: number;
  isPastDue: boolean;
  wasNotified: boolean;
  notificationDate?: Date;
}

export interface RecurringBillPattern {
  contactPattern: string;
  category: string;
  averageAmount: number;
  frequency: number; // Days between transactions
  confidence: number; // 0-1 how confident we are this is recurring
  lastTransactionDate: Date;
  nextExpectedDate: Date;
}