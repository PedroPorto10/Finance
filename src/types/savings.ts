export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  targetDate?: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  monthlyContribution?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: Date;
  method: 'manual' | 'automatic' | 'transaction';
  transactionId?: string;
  notes?: string;
}

export interface SavingsProgress {
  goal: SavingsGoal;
  percentage: number;
  remaining: number;
  monthsToGoal?: number;
  recommendedMonthlyAmount?: number;
  isOnTrack: boolean;
  projectedCompletionDate?: Date;
}