import { useState, useEffect } from 'react';
import { Table2, Wallet, TrendingUp, TrendingDown, DollarSign, Settings, Target, Bell, Shield, BarChart3, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTransactions } from '@/hooks/useTransactions';
import { useInvestmentPreferences } from '@/hooks/useInvestmentPreferences';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';
import { useIncomeSources } from '@/hooks/useIncomeSources';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useBillReminders } from '@/hooks/useBillReminders';
import { useCreditCardIntegration } from '@/hooks/useCreditCardIntegration';
import { useAnalytics } from '@/hooks/useAnalytics';
import { aiService, InvestmentInsight } from '@/lib/aiService';
import { useNavigate } from 'react-router-dom';
import { HybridBankNotifications } from '../lib/hybridBankNotifications';
import { MonthlyIncomeDialog } from '@/components/MonthlyIncomeDialog';
import { IncomeSourcesDialog } from '@/components/IncomeSourcesDialog';
import { InvestmentTypeSelector } from '@/components/InvestmentTypeSelector';
import { InvestmentInstructions } from '@/components/InvestmentInstructions';
import { FinancialHealthDialog } from '@/components/FinancialHealthDialog';
import { InvestmentType } from '@/types/investment';
import { investmentTypes } from '@/data/investmentTypes';

const Index = () => {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { selectedInvestmentType, setSelectedInvestmentType } = useInvestmentPreferences();
  const { monthlyIncome, setMonthlyIncome } = useMonthlyIncome();
  const {
    incomeSources,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    analyzeIncome,
    getTotalExpectedIncome
  } = useIncomeSources();

  // New hooks for enhanced features
  const { getBudgetStatuses, checkBudgetAlerts } = useBudgetAlerts();
  const { getAllSavingsProgress, getSavingsSummary } = useSavingsGoals();
  const { getUpcomingBills, getOverdueBills } = useBillReminders();
  const { getCreditCardSpending, getCreditUtilizationWarnings } = useCreditCardIntegration();
  const { getCategoryInsights, calculateFinancialHealth } = useAnalytics();

  const [investmentInsight, setInvestmentInsight] = useState<InvestmentInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [serviceStatus, setServiceStatus] = useState({ enabled: false, notificationEnabled: false, accessibilityEnabled: false });
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showIncomeSourcesDialog, setShowIncomeSourcesDialog] = useState(false);
  const [showFinancialHealthDialog, setShowFinancialHealthDialog] = useState(false);

  // Dashboard stats
  const budgetStatuses = getBudgetStatuses(transactions);
  const savingsProgress = getAllSavingsProgress();
  const savingsSummary = getSavingsSummary();
  const upcomingBills = getUpcomingBills(7);
  const overdueBills = getOverdueBills();
  const creditCardSpending = getCreditCardSpending(transactions);
  const creditUtilizationWarnings = getCreditUtilizationWarnings(creditCardSpending);
  const categoryInsights = getCategoryInsights(transactions);
  const financialHealth = calculateFinancialHealth(transactions, monthlyIncome);

  
  useEffect(() => {
    const loadInvestmentInsight = async () => {
      setLoadingInsight(true);
      try {
        const customType = selectedInvestmentType;
        const incomeAnalysis = analyzeIncome(transactions);
        console.log('AI Insight Debug:', {
          transactions: transactions.length,
          monthlyIncome,
          incomeAnalysis,
          customType
        });
        const insight = await aiService.generateInvestmentInsight(transactions, customType, monthlyIncome, incomeAnalysis);
        console.log('AI Insight Result:', insight);
        setInvestmentInsight(insight);
      } catch (error) {
        console.error('Error loading investment insight:', error);
      } finally {
        setLoadingInsight(false);
      }
    };

    loadInvestmentInsight();
    
    // Check service status
    HybridBankNotifications.isEnabled().then(status => {
      setServiceStatus(status);
      
    });
  }, [transactions, selectedInvestmentType, monthlyIncome, incomeSources, analyzeIncome]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  


  const handleInvestmentTypeSelect = (type: InvestmentType) => {
    setSelectedInvestmentType(type.id);
    // Update the insight with the selected type
    if (investmentInsight) {
      setInvestmentInsight({
        ...investmentInsight,
        customInvestmentType: type.id
      });
    }
  };

  // Helper function to get investment type display name
  const getInvestmentDisplayName = (investmentInsight: InvestmentInsight) => {
    const typeId = investmentInsight.customInvestmentType || investmentInsight.recommendedInvestmentId;
    const investmentType = investmentTypes.find(t => t.id === typeId);
    return investmentType ? investmentType.name : investmentInsight.investmentType;
  };
  
  // Permission dialog removed - always show main app
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Finance</h1>
              <p className="text-muted-foreground text-lg">Organize suas finanças</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <Button
            onClick={() => navigate('/tables')}
            className="h-20 bg-gradient-card text-card-foreground hover:shadow-xl border border-border rounded-2xl transition-all duration-200"
            variant="ghost"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Table2 className="h-7 w-7 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-lg">Ver Tabelas Detalhadas</p>
                <p className="text-base text-muted-foreground">Transações do mês atual</p>
              </div>
            </div>
          </Button>
        </div>

        {/* Income Sources Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowIncomeSourcesDialog(true)}
            className="w-full h-12 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-xl transition-colors"
            variant="outline"
          >
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            {incomeSources.length > 0 ? 'Gerenciar Fontes de Renda' : 'Configurar Fontes de Renda'}
            {incomeSources.length > 0 && (
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                {incomeSources.length}
              </span>
            )}
          </Button>
        </div>

        {/* AI Investment Insights - Moved up */}
        <Card className="bg-gradient-primary shadow-xl mb-8 rounded-2xl">
          <CardContent className="p-6">
            {loadingInsight ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground"></div>
                <p className="ml-3 text-primary-foreground/80">Gerando insights de IA...</p>
              </div>
            ) : investmentInsight ? (
              <div>
                <div className="text-center mb-6">
                  <p className="text-primary-foreground/80 text-sm mb-1">💡 Insight de Investimento (IA)</p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    Poupe {formatCurrency(investmentInsight.recommendedSavings)}/mês
                  </p>
                  <p className="text-primary-foreground/70 text-sm">
                    {investmentInsight.savingsPercentage.toFixed(1)}% da sua renda
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-primary-foreground/70 text-xs">Renda Mensal</p>
                    <p className="text-lg font-semibold text-primary-foreground">
                      {formatCurrency(investmentInsight.monthlyIncome)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-primary-foreground/70 text-xs">Gastos Mensais</p>
                    <p className="text-lg font-semibold text-primary-foreground">
                      {formatCurrency(investmentInsight.monthlyExpenses)}
                    </p>
                  </div>
                </div>

                <div className="bg-primary-foreground/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                      <span className="text-xs">💎</span>
                    </div>
                    <span className="font-medium text-primary-foreground text-sm">
                      {getInvestmentDisplayName(investmentInsight)}
                    </span>
                  </div>
                  <p className="text-primary-foreground/80 text-xs leading-relaxed">
                    {investmentInsight.recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-primary-foreground/80 text-sm">
                  Faça algumas transações para receber insights personalizados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Customization - Moved up */}
        {transactions.length > 0 && (
          <Card className="bg-gradient-card shadow-xl mb-8 rounded-2xl">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Personalize seus investimentos
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Escolha o tipo de investimento que mais se adequa ao seu perfil
                </p>
                <InvestmentTypeSelector
                  selectedType={investmentInsight?.customInvestmentType || selectedInvestmentType}
                  aiRecommendedType={investmentInsight?.recommendedInvestmentId}
                  onSelect={handleInvestmentTypeSelect}
                />

                {/* Show instructions for selected investment type */}
                {(investmentInsight?.customInvestmentType || selectedInvestmentType) && (
                  <div className="mt-4 flex justify-center">
                    <InvestmentInstructions investmentTypeId={investmentInsight?.customInvestmentType || selectedInvestmentType} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Dashboard Sections */}
        {transactions.length > 0 && (
          <>
            {/* Financial Health Score - with click handler */}
            <Card
              className="mb-6 border-border cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setShowFinancialHealthDialog(true)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Saúde Financeira</h3>
                  </div>
                  <span className="text-2xl font-bold text-primary">{financialHealth.score}</span>
                </div>
                <Progress value={financialHealth.score} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {financialHealth.riskLevel === 'low' ? '✅ Excelente - Clique para dicas' :
                   financialHealth.riskLevel === 'medium' ? '⚠️ Moderado - Clique para dicas' : '🚨 Atenção necessária - Clique para dicas'}
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Savings Goals */}
              {savingsProgress.length > 0 && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium">Metas</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {savingsSummary.activeGoals}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      R$ {savingsSummary.totalSaved.toLocaleString('pt-BR')} economizado
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Budget Alerts */}
              {budgetStatuses.length > 0 && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="h-4 w-4 text-orange-600" />
                      <p className="text-sm font-medium">Orçamentos</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {budgetStatuses.filter(b => b.isNearLimit).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Próximos do limite</p>
                  </CardContent>
                </Card>
              )}

              {/* Credit Cards */}
              {creditCardSpending.length > 0 && (
                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium">Cartões</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {creditCardSpending.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {creditUtilizationWarnings.length > 0 ? `${creditUtilizationWarnings.length} alertas` : 'Tudo OK'}
                    </p>
                  </CardContent>
                </Card>
              )}

            </div>

            {/* Alerts and Warnings */}
            {(overdueBills.length > 0 || upcomingBills.length > 0 || creditUtilizationWarnings.length > 0) && (
              <Card className="mb-6 border-l-4 border-l-orange-500 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-foreground">Alertas Importantes</h3>
                  </div>
                  <div className="space-y-2">
                    {overdueBills.map((bill) => (
                      <div key={bill.id} className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        🚨 <span className="font-medium">{bill.name}</span> está em atraso
                      </div>
                    ))}
                    {upcomingBills.slice(0, 2).map((bill) => (
                      <div key={bill.id} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                        ⏰ <span className="font-medium">{bill.name}</span> vence em {Math.ceil((bill.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
                      </div>
                    ))}
                    {creditUtilizationWarnings.slice(0, 2).map((warning, index) => (
                      <div key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate('/settings')}
                  >
                    Gerenciar Alertas
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Top Savings Goal Progress */}
            {savingsProgress.length > 0 && (
              <Card className="mb-6 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-foreground">Meta Principal</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/savings-goals')}
                    >
                      Ver todas
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {savingsProgress.slice(0, 2).map((progress) => (
                      <div key={progress.goal.id}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="font-medium text-foreground">{progress.goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {progress.percentage.toFixed(0)}%
                          </p>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          R$ {progress.goal.currentAmount.toLocaleString('pt-BR')} / R$ {progress.goal.targetAmount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions for New Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Button
                variant="outline"
                className="h-16 p-4"
                onClick={() => navigate('/settings')}
              >
                <div className="flex flex-col items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <span className="text-sm">Configurações</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-16 p-4"
                onClick={() => navigate('/analytics')}
              >
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-sm">Análises</span>
                </div>
              </Button>
            </div>
          </>
        )}

        {/* Service Setup Card for users with no transactions */}
        {transactions.length === 0 && (
          <Card className="bg-gradient-card shadow-xl rounded-2xl">
            <CardContent className="px-6 py-8">
              <div className="text-center text-muted-foreground">
                <div className="p-6 bg-muted/10 rounded-3xl inline-block mb-6">
                  <Wallet className="h-20 w-20 mx-auto opacity-50" />
                </div>
                <p className="mb-3 text-xl font-medium">Nenhuma transação encontrada</p>
                <p className="text-base mb-6">Faça uma transação PIX no C6 Bank para começar</p>
                
                {!serviceStatus.enabled && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-blue-800 dark:text-blue-200 font-medium mb-4">Configure os serviços para capturar transações</p>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => HybridBankNotifications.openNotificationSettings()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        1. Habilitar Acesso a Notificações
                      </Button>
                      <Button 
                        onClick={() => HybridBankNotifications.openAccessibilitySettings()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        2. Habilitar Acessibilidade (backup)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MonthlyIncomeDialog
        open={showIncomeDialog}
        onOpenChange={setShowIncomeDialog}
        currentIncome={monthlyIncome}
        onIncomeSet={setMonthlyIncome}
      />

      <IncomeSourcesDialog
        open={showIncomeSourcesDialog}
        onOpenChange={setShowIncomeSourcesDialog}
        incomeSources={incomeSources}
        onAddSource={addIncomeSource}
        onUpdateSource={updateIncomeSource}
        onDeleteSource={deleteIncomeSource}
      />

      <FinancialHealthDialog
        open={showFinancialHealthDialog}
        onOpenChange={setShowFinancialHealthDialog}
        financialHealth={financialHealth}
      />
    </div>
  );
};

export default Index;