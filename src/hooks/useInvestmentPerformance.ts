import { useState, useEffect, useCallback } from 'react';
import { InvestmentPosition, InvestmentPerformance, PortfolioSummary } from '@/types/investment';

const POSITIONS_STORAGE_KEY = 'investment-positions';

// Mock price data for Brazilian investment types (in reality, you'd fetch from APIs)
const mockPriceData: { [key: string]: number } = {
  'poupanca': 1.006, // 0.6% monthly return
  'cdb': 1.010,     // 1.0% monthly return
  'tesouro-selic': 1.008,  // 0.8% monthly return
  'tesouro-ipca': 1.012,   // 1.2% monthly return
  'lci-lca': 1.009,        // 0.9% monthly return
  'fundos-renda-fixa': 1.007, // 0.7% monthly return
  'acoes-c6': 1.015,       // 1.5% monthly return (more volatile)
  'fundos-multimercado': 1.011, // 1.1% monthly return
};

const loadStoredPositions = (): InvestmentPosition[] => {
  try {
    const stored = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const loadedPositions = parsed.map((pos: { id: string; type: string; amount: number; purchaseDate: string; currentValue: number; description: string }) => ({
        ...pos,
        purchaseDate: new Date(pos.purchaseDate),
      }));
      console.log('Loaded investment positions:', loadedPositions);
      return loadedPositions;
    }
  } catch (error) {
    console.error('Error loading investment positions:', error);
  }
  return [];
};

export const useInvestmentPerformance = () => {
  const [positions, setPositions] = useState<InvestmentPosition[]>(loadStoredPositions());

  // Save positions to localStorage
  const savePositions = useCallback((newPositions: InvestmentPosition[]) => {
    try {
      localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(newPositions));
      setPositions(newPositions);
    } catch (error) {
      console.error('Error saving investment positions:', error);
    }
  }, []);

  // Add a new investment position
  const addInvestmentPosition = useCallback((position: Omit<InvestmentPosition, 'id'>) => {
    const newPosition: InvestmentPosition = {
      ...position,
      id: `position-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updatedPositions = [...positions, newPosition];
    savePositions(updatedPositions);
    return newPosition;
  }, [positions, savePositions]);

  // Update an investment position
  const updateInvestmentPosition = useCallback((id: string, updates: Partial<InvestmentPosition>) => {
    const updatedPositions = positions.map(pos =>
      pos.id === id ? { ...pos, ...updates } : pos
    );
    savePositions(updatedPositions);
  }, [positions, savePositions]);

  // Delete an investment position
  const deleteInvestmentPosition = useCallback((id: string) => {
    const updatedPositions = positions.filter(pos => pos.id !== id);
    savePositions(updatedPositions);
  }, [positions, savePositions]);

  // Calculate mock current price based on time elapsed and type
  const calculateCurrentPrice = useCallback((position: InvestmentPosition): number => {
    const monthlyRate = mockPriceData[position.typeId] || 1.005;
    const now = new Date();
    const monthsElapsed = (now.getTime() - position.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Add some volatility for stocks
    let volatility = 1;
    if (position.typeId.includes('acoes') || position.typeId.includes('multimercado')) {
      const randomFactor = 0.95 + Math.random() * 0.1; // ±5% random variation
      volatility = randomFactor;
    }

    return position.purchasePrice * Math.pow(monthlyRate, monthsElapsed) * volatility;
  }, []);

  // Calculate investment performance
  const calculatePerformance = useCallback((position: InvestmentPosition): InvestmentPerformance => {
    const currentPrice = position.currentPrice || calculateCurrentPrice(position);
    const currentValue = position.quantity ? position.quantity * currentPrice : position.amount * (currentPrice / position.purchasePrice);
    const totalReturn = currentValue - position.amount;
    const returnPercentage = position.amount > 0 ? (totalReturn / position.amount) * 100 : 0;

    // Calculate time-based returns
    const now = new Date();
    const daysElapsed = (now.getTime() - position.purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
    const monthsElapsed = daysElapsed / 30;
    const yearsElapsed = daysElapsed / 365;

    const dailyReturn = daysElapsed > 0 ? Math.pow(1 + returnPercentage / 100, 1 / daysElapsed) - 1 : 0;
    const monthlyReturn = monthsElapsed > 0 ? Math.pow(1 + returnPercentage / 100, 1 / monthsElapsed) - 1 : 0;
    const yearlyReturn = yearsElapsed > 0 ? Math.pow(1 + returnPercentage / 100, 1 / yearsElapsed) - 1 : 0;

    const netReturn = totalReturn - position.fees;
    const netReturnPercentage = position.amount > 0 ? (netReturn / position.amount) * 100 : 0;

    return {
      position: { ...position, currentPrice },
      currentValue,
      totalReturn,
      returnPercentage,
      dailyReturn: dailyReturn * 100,
      monthlyReturn: monthlyReturn * 100,
      yearlyReturn: yearlyReturn * 100,
      fees: position.fees,
      netReturn,
      netReturnPercentage,
    };
  }, [calculateCurrentPrice]);

  // Get all investment performances
  const getAllPerformances = useCallback(() => {
    return positions
      .filter(pos => pos.isActive)
      .map(pos => calculatePerformance(pos))
      .sort((a, b) => b.netReturnPercentage - a.netReturnPercentage);
  }, [positions, calculatePerformance]);

  // Calculate portfolio summary
  const getPortfolioSummary = useCallback(() => {
    const performances = getAllPerformances();

    const totalInvested = performances.reduce((total, perf) => total + perf.position.amount, 0);
    const currentValue = performances.reduce((total, perf) => total + perf.currentValue, 0);
    const totalReturn = currentValue - totalInvested;
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
    const totalFees = performances.reduce((total, perf) => total + perf.fees, 0);
    const netReturn = totalReturn - totalFees;
    const netReturnPercentage = totalInvested > 0 ? (netReturn / totalInvested) * 100 : 0;

    // Calculate asset allocation
    const typeMap = new Map<string, { amount: number; percentage: number }>();
    performances.forEach(perf => {
      const type = perf.position.typeId;
      if (!typeMap.has(type)) {
        typeMap.set(type, { amount: 0, percentage: 0 });
      }
      const typeData = typeMap.get(type)!;
      typeData.amount += perf.currentValue;
    });

    const assetAllocation = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      amount: data.amount,
      percentage: currentValue > 0 ? (data.amount / currentValue) * 100 : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    return {
      totalInvested,
      currentValue,
      totalReturn,
      totalReturnPercentage,
      totalFees,
      netReturn,
      netReturnPercentage,
      positions: performances,
      assetAllocation,
    };
  }, [getAllPerformances]);

  // Get investment recommendations based on performance
  const getInvestmentRecommendations = useCallback(() => {
    const summary = getPortfolioSummary();
    const recommendations: string[] = [];

    if (summary.totalInvested === 0) {
      recommendations.push('Comece investindo com produtos de baixo risco como Poupança ou CDB');
      return recommendations;
    }

    // Diversification recommendations
    if (summary.assetAllocation.length === 1) {
      recommendations.push('Diversifique seus investimentos para reduzir riscos');
    }

    // Performance-based recommendations
    if (summary.totalReturnPercentage < 5) {
      recommendations.push('Consider investimentos com maior potencial de retorno');
    }

    // High fees warning
    if (summary.totalFees > summary.totalInvested * 0.02) {
      recommendations.push('Atenção às taxas - considere investimentos com menores custos');
    }

    // Asset allocation recommendations
    const highestAllocation = summary.assetAllocation[0];
    if (highestAllocation && highestAllocation.percentage > 70) {
      recommendations.push(`Você tem ${highestAllocation.percentage.toFixed(1)}% em ${highestAllocation.type}. Considere diversificar.`);
    }

    // Time-based recommendations
    const oldestPosition = summary.positions.reduce((oldest, current) =>
      current.position.purchaseDate < oldest.position.purchaseDate ? current : oldest
    );

    if (oldestPosition) {
      const monthsHeld = (Date.now() - oldestPosition.position.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsHeld > 12 && oldestPosition.returnPercentage < 10) {
        recommendations.push('Reavalie investimentos antigos com baixo desempenho');
      }
    }

    return recommendations.length > 0 ? recommendations : ['Seus investimentos estão bem balanceados!'];
  }, [getPortfolioSummary]);

  // Simulate market data update (would be real API in production)
  const updateMarketPrices = useCallback(() => {
    const updatedPositions = positions.map(position => ({
      ...position,
      currentPrice: calculateCurrentPrice(position),
    }));
    savePositions(updatedPositions);
  }, [positions, calculateCurrentPrice, savePositions]);

  return {
    positions,
    addInvestmentPosition,
    updateInvestmentPosition,
    deleteInvestmentPosition,
    calculatePerformance,
    getAllPerformances,
    getPortfolioSummary,
    getInvestmentRecommendations,
    updateMarketPrices,
  };
};