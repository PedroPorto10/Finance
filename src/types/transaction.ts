export interface Transaction {
  id: string;
  type: 'received' | 'sent';
  amount: number;
  date: Date;
  contact: string;
  description?: string;
  category?: 'Alimentação' | 'Laser' | 'Contas' | 'Transporte' | 'Outros';
  source?: 'pix' | 'credit_card' | 'debit' | 'cash' | 'bank_transfer';
  tags?: string[];
  isRecurring?: boolean;
  recurringId?: string;
}

export interface CreditCardTransaction extends Transaction {
  source: 'credit_card';
  cardLast4?: string;
  installments?: number;
  currentInstallment?: number;
  dueDate?: Date;
}

export interface MonthlyData {
  month: string;
  received: number;
  sent: number;
}