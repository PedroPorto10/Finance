export interface InvestmentType {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: string;
  minAmount: number;
  liquidity: string;
  icon: string;
  c6BankInstructions: string;
  c6BankAvailable: boolean;
}

export interface UserInvestmentPreference {
  selectedType: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentGoal: 'emergency' | 'short_term' | 'long_term' | 'retirement';
  timeHorizon: number; // in months
}

export interface InvestmentPosition {
  id: string;
  typeId: string;
  name: string;
  amount: number;
  purchaseDate: Date;
  purchasePrice: number;
  currentPrice?: number;
  quantity?: number;
  fees: number;
  isActive: boolean;
  notes?: string;
}

export interface InvestmentPerformance {
  position: InvestmentPosition;
  currentValue: number;
  totalReturn: number;
  returnPercentage: number;
  dailyReturn?: number;
  monthlyReturn?: number;
  yearlyReturn?: number;
  fees: number;
  netReturn: number;
  netReturnPercentage: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  totalFees: number;
  netReturn: number;
  netReturnPercentage: number;
  positions: InvestmentPerformance[];
  assetAllocation: {
    type: string;
    percentage: number;
    amount: number;
  }[];
}

// Simple Investment interface for the Investments page
export interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  acquisitionDate: string;
  expectedReturn: number;
  risk: 'low' | 'medium' | 'high';
}