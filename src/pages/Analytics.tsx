import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';

const Analytics = () => {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { getCategoryInsights, calculateFinancialHealth } = useAnalytics();
  const { monthlyIncome } = useMonthlyIncome();

  const categoryInsights = getCategoryInsights(transactions);
  const financialHealth = calculateFinancialHealth(transactions, monthlyIncome);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análises</h1>
            <p className="text-muted-foreground">Insights detalhados dos seus gastos</p>
          </div>
        </div>

        {/* Financial Health Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Saúde Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-primary mb-2">{financialHealth.score}</div>
              <p className="text-sm text-muted-foreground">
                {financialHealth.riskLevel === 'low' ? '✅ Excelente' :
                 financialHealth.riskLevel === 'medium' ? '⚠️ Moderado' : '🚨 Atenção necessária'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Economia</span>
                <span className="text-sm font-medium">{financialHealth.factors.savingsRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Consistência de Gastos</span>
                <span className="text-sm font-medium">{financialHealth.factors.spendingConsistency.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Balanceamento de Categorias</span>
                <span className="text-sm font-medium">{financialHealth.factors.categoryBalance.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Reserva de Emergência</span>
                <span className="text-sm font-medium">{financialHealth.factors.emergencyFund.toFixed(1)}%</span>
              </div>
            </div>

            {financialHealth.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Recomendações:</p>
                <ul className="text-xs space-y-1">
                  {financialHealth.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Insights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Insights por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryInsights.slice(0, 5).map((insight) => (
                <div key={insight.category} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{insight.category}</h4>
                    <div className="flex items-center gap-1">
                      {insight.trend === 'increasing' ?
                        <TrendingUp className="h-4 w-4 text-red-500" /> :
                        insight.trend === 'decreasing' ?
                        <TrendingDown className="h-4 w-4 text-green-500" /> :
                        <span className="h-4 w-4" />
                      }
                      <span className="text-sm font-medium">{insight.percentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p>Total Gasto</p>
                      <p className="font-medium text-foreground">{formatCurrency(insight.totalSpent)}</p>
                    </div>
                    <div>
                      <p>Transações</p>
                      <p className="font-medium text-foreground">{insight.transactionCount}</p>
                    </div>
                  </div>

                  {insight.topMerchants.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Principal Comerciante:</p>
                      <div className="flex justify-between text-sm">
                        <span>{insight.topMerchants[0].contact}</span>
                        <span className="font-medium">{formatCurrency(insight.topMerchants[0].totalSpent)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {transactions.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Nenhuma análise disponível</h3>
              <p className="text-sm text-muted-foreground">
                Faça algumas transações para ver insights detalhados
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;