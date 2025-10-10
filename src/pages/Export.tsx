import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, Filter, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useExport } from '@/hooks/useExport';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useInvestmentPerformance } from '@/hooks/useInvestmentPerformance';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Transaction } from '@/types/transaction';

const Export = () => {
  const navigate = useNavigate();
  const { exportData } = useExport();
  const { transactions } = useTransactions();
  const { getBudgetStatuses } = useBudgetAlerts();
  const { savingsGoals } = useSavingsGoals();
  const { getAllPerformances } = useInvestmentPerformance();
  const { getCategoryInsights } = useAnalytics();

  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateFrom: '',
    dateTo: '',
    categories: [] as string[],
    includeIncome: true,
    includeExpenses: true,
    includeInvestments: false,
    includeBudgets: false,
    includeGoals: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const categories = [
    'Alimentação',
    'Transporte',
    'Entretenimento',
    'Saúde',
    'Educação',
    'Compras',
    'Cartão de Crédito',
    'Transferência',
    'Outros'
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV (Excel)', description: 'Planilha compatível com Excel e Google Sheets' },
    { value: 'pdf', label: 'PDF', description: 'Relatório formatado para impressão' },
    { value: 'json', label: 'JSON', description: 'Dados estruturados para desenvolvedores' }
  ];

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setExportConfig({
        ...exportConfig,
        categories: [...exportConfig.categories, category]
      });
    } else {
      setExportConfig({
        ...exportConfig,
        categories: exportConfig.categories.filter(c => c !== category)
      });
    }
  };

  const handleSelectAllCategories = (checked: boolean) => {
    setExportConfig({
      ...exportConfig,
      categories: checked ? [...categories] : []
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      // Filter transactions based on categories and type
      let filteredTransactions = transactions;

      // Filter by categories if specified
      if (exportConfig.categories.length > 0) {
        filteredTransactions = filteredTransactions.filter(t =>
          exportConfig.categories.includes(t.category || 'Outros')
        );
      }

      // Filter by income/expenses
      if (!exportConfig.includeIncome || !exportConfig.includeExpenses) {
        filteredTransactions = filteredTransactions.filter(t => {
          if (!exportConfig.includeIncome && t.type === 'received') return false;
          if (!exportConfig.includeExpenses && t.type === 'sent') return false;
          return true;
        });
      }

      // Prepare data for export
      const exportDataPayload: Record<string, unknown> = {};

      if (exportConfig.includeIncome || exportConfig.includeExpenses) {
        exportDataPayload.transactions = filteredTransactions;
      }

      if (exportConfig.includeBudgets) {
        exportDataPayload.budgets = getBudgetStatuses(filteredTransactions);
      }

      if (exportConfig.includeGoals) {
        exportDataPayload.savings = savingsGoals.map(goal => ({
          goal,
          remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
          percentage: (goal.currentAmount / goal.targetAmount) * 100,
          isOnTrack: true // Simplified logic
        }));
      }

      if (exportConfig.includeInvestments) {
        exportDataPayload.investments = getAllPerformances();
      }

      // Analytics is included with any transaction data
      if (exportDataPayload.transactions) {
        exportDataPayload.analytics = getCategoryInsights(exportDataPayload.transactions as Transaction[]);
      }

      // Set up date range if specified
      let dateRange;
      if (exportConfig.dateFrom || exportConfig.dateTo) {
        dateRange = {
          startDate: exportConfig.dateFrom ? new Date(exportConfig.dateFrom) : new Date(0),
          endDate: exportConfig.dateTo ? new Date(exportConfig.dateTo) : new Date()
        };
      }

      // Determine export type
      let exportType = 'complete';
      if (Object.keys(exportDataPayload).length === 1) {
        if (exportDataPayload.transactions) exportType = 'transactions';
        else if (exportDataPayload.budgets) exportType = 'budget';
        else if (exportDataPayload.savings) exportType = 'savings';
        else if (exportDataPayload.investments) exportType = 'investments';
      }

      // Export the data
      const result = await exportData(
        {
          format: exportConfig.format as 'csv' | 'json',
          type: exportType as 'transactions' | 'budget' | 'savings' | 'investments' | 'complete',
          dateRange
        },
        exportDataPayload
      );

      if (result.success) {
        setExportComplete(true);
        setTimeout(() => {
          setExportComplete(false);
        }, 3000);
      } else {
        console.error('Export failed:', result.error);
        // Could show an error toast here
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isExportReady = () => {
    return (exportConfig.includeIncome || exportConfig.includeExpenses ||
            exportConfig.includeInvestments || exportConfig.includeBudgets ||
            exportConfig.includeGoals) &&
           (exportConfig.categories.length > 0 ||
            (!exportConfig.includeExpenses && !exportConfig.includeIncome));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 px-4 py-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
            <p className="text-muted-foreground">Baixe seus dados financeiros</p>
          </div>
        </div>

        {/* Export Format */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Formato de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exportFormats.map((format) => (
              <div
                key={format.value}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  exportConfig.format === format.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setExportConfig({ ...exportConfig, format: format.value })}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    exportConfig.format === format.value
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}>
                    {exportConfig.format === format.value && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{format.label}</p>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dateFrom">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={exportConfig.dateFrom}
                  onChange={(e) => setExportConfig({ ...exportConfig, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={exportConfig.dateTo}
                  onChange={(e) => setExportConfig({ ...exportConfig, dateTo: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para exportar todos os dados
            </p>
          </CardContent>
        </Card>

        {/* Data Types */}
        <Card className="mb-6 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Dados para Exportar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeIncome"
                  checked={exportConfig.includeIncome}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, includeIncome: !!checked })}
                />
                <label htmlFor="includeIncome" className="text-sm font-medium">
                  Receitas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeExpenses"
                  checked={exportConfig.includeExpenses}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, includeExpenses: !!checked })}
                />
                <label htmlFor="includeExpenses" className="text-sm font-medium">
                  Despesas
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInvestments"
                  checked={exportConfig.includeInvestments}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, includeInvestments: !!checked })}
                />
                <label htmlFor="includeInvestments" className="text-sm font-medium">
                  Investimentos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBudgets"
                  checked={exportConfig.includeBudgets}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, includeBudgets: !!checked })}
                />
                <label htmlFor="includeBudgets" className="text-sm font-medium">
                  Orçamentos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeGoals"
                  checked={exportConfig.includeGoals}
                  onCheckedChange={(checked) => setExportConfig({ ...exportConfig, includeGoals: !!checked })}
                />
                <label htmlFor="includeGoals" className="text-sm font-medium">
                  Metas de Economia
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Filter */}
        {(exportConfig.includeExpenses || exportConfig.includeIncome) && (
          <Card className="mb-6 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Categorias</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={exportConfig.categories.length === categories.length}
                  onCheckedChange={handleSelectAllCategories}
                />
                <label htmlFor="selectAll" className="text-sm font-medium">
                  Selecionar Todas
                </label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={exportConfig.categories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                    />
                    <label htmlFor={category} className="text-sm">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={!isExportReady() || isExporting}
          className="w-full mb-6"
          size="lg"
        >
          {isExporting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exportando...
            </div>
          ) : exportComplete ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Download Concluído!
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Dados
            </div>
          )}
        </Button>

        {/* Export Preview */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Sobre a exportação</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Os dados são exportados com base na configuração selecionada</p>
                  <p>• Arquivos CSV podem ser abertos no Excel ou Google Sheets</p>
                  <p>• PDFs são ideais para relatórios e impressão</p>
                  <p>• JSON é útil para desenvolvedores e backup de dados</p>
                  <p>• Todos os dados são processados localmente no seu dispositivo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Export;