import { useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { BudgetStatus } from '@/types/budget';
import { SavingsProgress } from '@/types/savings';
import { InvestmentPerformance } from '@/types/investment';
import { CategoryInsight } from '@/types/analytics';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ExportFormat = 'csv' | 'json';
export type ExportType = 'transactions' | 'budget' | 'savings' | 'investments' | 'analytics' | 'complete';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export const useExport = () => {
  // Convert transactions to CSV
  const transactionsToCSV = useCallback((transactions: Transaction[]): string => {
    const headers = [
      'ID',
      'Tipo',
      'Valor',
      'Data',
      'Contato',
      'Descrição',
      'Categoria',
      'Fonte'
    ];

    const rows = transactions.map(transaction => [
      transaction.id,
      transaction.type === 'received' ? 'Recebido' : 'Enviado',
      transaction.amount.toFixed(2),
      transaction.date.toLocaleDateString('pt-BR'),
      `"${transaction.contact}"`,
      `"${transaction.description || ''}"`,
      transaction.category || '',
      transaction.source || 'pix'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }, []);

  // Convert budget data to CSV
  const budgetToCSV = useCallback((budgets: BudgetStatus[]): string => {
    const headers = [
      'Categoria',
      'Orçamento',
      'Gasto',
      'Restante',
      'Porcentagem',
      'Status'
    ];

    const rows = budgets.map(budget => [
      budget.category,
      budget.limit.toFixed(2),
      budget.spent.toFixed(2),
      budget.remaining.toFixed(2),
      `${budget.percentage.toFixed(1)}%`,
      budget.isOverBudget ? 'Ultrapassado' : budget.isNearLimit ? 'Próximo do limite' : 'OK'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }, []);

  // Convert savings data to CSV
  const savingsToCSV = useCallback((savings: SavingsProgress[]): string => {
    const headers = [
      'Meta',
      'Categoria',
      'Valor Objetivo',
      'Valor Atual',
      'Restante',
      'Porcentagem',
      'Data Objetivo',
      'Status'
    ];

    const rows = savings.map(saving => [
      `"${saving.goal.name}"`,
      saving.goal.category,
      saving.goal.targetAmount.toFixed(2),
      saving.goal.currentAmount.toFixed(2),
      saving.remaining.toFixed(2),
      `${saving.percentage.toFixed(1)}%`,
      saving.goal.targetDate ? saving.goal.targetDate.toLocaleDateString('pt-BR') : '',
      saving.isOnTrack ? 'No prazo' : 'Atrasado'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }, []);

  // Convert investment data to CSV
  const investmentsToCSV = useCallback((investments: InvestmentPerformance[]): string => {
    const headers = [
      'Nome',
      'Tipo',
      'Valor Investido',
      'Valor Atual',
      'Retorno Total',
      'Retorno %',
      'Retorno Anual %',
      'Taxas',
      'Retorno Líquido',
      'Data Compra'
    ];

    const rows = investments.map(investment => [
      `"${investment.position.name}"`,
      investment.position.typeId,
      investment.position.amount.toFixed(2),
      investment.currentValue.toFixed(2),
      investment.totalReturn.toFixed(2),
      `${investment.returnPercentage.toFixed(2)}%`,
      `${(investment.yearlyReturn || 0).toFixed(2)}%`,
      investment.fees.toFixed(2),
      investment.netReturn.toFixed(2),
      investment.position.purchaseDate.toLocaleDateString('pt-BR')
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }, []);

  // Convert analytics data to CSV
  const analyticsToCSV = useCallback((analytics: CategoryInsight[]): string => {
    const headers = [
      'Categoria',
      'Total Gasto',
      'Número de Transações',
      'Transação Média',
      'Porcentagem',
      'Tendência',
      'Principal Comerciante',
      'Gasto Principal Comerciante'
    ];

    const rows = analytics.map(insight => [
      insight.category,
      insight.totalSpent.toFixed(2),
      insight.transactionCount.toString(),
      insight.averageTransaction.toFixed(2),
      `${insight.percentage.toFixed(1)}%`,
      insight.trend === 'increasing' ? 'Crescendo' :
        insight.trend === 'decreasing' ? 'Diminuindo' : 'Estável',
      insight.topMerchants.length > 0 ? `"${insight.topMerchants[0].contact}"` : '',
      insight.topMerchants.length > 0 ? insight.topMerchants[0].totalSpent.toFixed(2) : '0'
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }, []);

  // Create complete financial report
  const createCompleteReport = useCallback((data: {
    transactions: Transaction[];
    budgets: BudgetStatus[];
    savings: SavingsProgress[];
    investments: InvestmentPerformance[];
    analytics: CategoryInsight[];
  }): string => {
    const report = [];

    // Header
    report.push('RELATÓRIO FINANCEIRO COMPLETO');
    report.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    report.push('');

    // Summary
    const totalReceived = data.transactions
      .filter(t => t.type === 'received')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSent = data.transactions
      .filter(t => t.type === 'sent')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalReceived - totalSent;

    report.push('=== RESUMO GERAL ===');
    report.push(`Total Recebido: R$ ${totalReceived.toFixed(2)}`);
    report.push(`Total Gasto: R$ ${totalSent.toFixed(2)}`);
    report.push(`Saldo: R$ ${balance.toFixed(2)}`);
    report.push(`Total de Transações: ${data.transactions.length}`);
    report.push('');

    // Budget Summary
    if (data.budgets.length > 0) {
      report.push('=== ORÇAMENTOS ===');
      const totalBudget = data.budgets.reduce((sum, b) => sum + b.limit, 0);
      const totalSpent = data.budgets.reduce((sum, b) => sum + b.spent, 0);
      report.push(`Orçamento Total: R$ ${totalBudget.toFixed(2)}`);
      report.push(`Total Gasto: R$ ${totalSpent.toFixed(2)}`);
      report.push(`Utilização: ${((totalSpent / totalBudget) * 100).toFixed(1)}%`);

      data.budgets.forEach(budget => {
        const status = budget.isOverBudget ? 'ULTRAPASSADO' :
                     budget.isNearLimit ? 'PRÓXIMO DO LIMITE' : 'OK';
        report.push(`${budget.category}: R$ ${budget.spent.toFixed(2)} / R$ ${budget.limit.toFixed(2)} (${budget.percentage.toFixed(1)}%) - ${status}`);
      });
      report.push('');
    }

    // Savings Summary
    if (data.savings.length > 0) {
      report.push('=== METAS DE ECONOMIA ===');
      const totalTarget = data.savings.reduce((sum, s) => sum + s.goal.targetAmount, 0);
      const totalSaved = data.savings.reduce((sum, s) => sum + s.goal.currentAmount, 0);
      report.push(`Meta Total: R$ ${totalTarget.toFixed(2)}`);
      report.push(`Total Economizado: R$ ${totalSaved.toFixed(2)}`);
      report.push(`Progresso: ${((totalSaved / totalTarget) * 100).toFixed(1)}%`);

      data.savings.forEach(saving => {
        const status = saving.percentage >= 100 ? 'CONCLUÍDA' :
                      saving.isOnTrack ? 'NO PRAZO' : 'ATRASADA';
        report.push(`${saving.goal.name}: R$ ${saving.goal.currentAmount.toFixed(2)} / R$ ${saving.goal.targetAmount.toFixed(2)} (${saving.percentage.toFixed(1)}%) - ${status}`);
      });
      report.push('');
    }

    // Investment Summary
    if (data.investments.length > 0) {
      report.push('=== INVESTIMENTOS ===');
      const totalInvested = data.investments.reduce((sum, i) => sum + i.position.amount, 0);
      const totalValue = data.investments.reduce((sum, i) => sum + i.currentValue, 0);
      const totalReturn = totalValue - totalInvested;
      report.push(`Total Investido: R$ ${totalInvested.toFixed(2)}`);
      report.push(`Valor Atual: R$ ${totalValue.toFixed(2)}`);
      report.push(`Retorno: R$ ${totalReturn.toFixed(2)} (${((totalReturn / totalInvested) * 100).toFixed(2)}%)`);

      data.investments.forEach(investment => {
        report.push(`${investment.position.name}: R$ ${investment.totalReturn.toFixed(2)} (${investment.returnPercentage.toFixed(2)}%)`);
      });
      report.push('');
    }

    // Category Analysis
    if (data.analytics.length > 0) {
      report.push('=== ANÁLISE POR CATEGORIA ===');
      data.analytics.forEach(category => {
        const trend = category.trend === 'increasing' ? '↗️' :
                     category.trend === 'decreasing' ? '↘️' : '➡️';
        report.push(`${category.category}: R$ ${category.totalSpent.toFixed(2)} (${category.percentage.toFixed(1)}%) ${trend}`);
        if (category.topMerchants.length > 0) {
          report.push(`  Principal: ${category.topMerchants[0].contact} - R$ ${category.topMerchants[0].totalSpent.toFixed(2)}`);
        }
      });
    }

    return report.join('\n');
  }, []);

  // Export data function
  const exportData = useCallback(async (
    options: ExportOptions,
    data: {
      transactions?: Transaction[];
      budgets?: BudgetStatus[];
      savings?: SavingsProgress[];
      investments?: InvestmentPerformance[];
      analytics?: CategoryInsight[];
    }
  ) => {
    let content = '';
    let filename = '';

    // Filter transactions by date range if provided
    let filteredTransactions = data.transactions || [];
    if (options.dateRange && data.transactions) {
      filteredTransactions = data.transactions.filter(t =>
        t.date >= options.dateRange!.startDate && t.date <= options.dateRange!.endDate
      );
    }

    // Generate content based on type and format
    switch (options.type) {
      case 'transactions':
        filename = `transacoes_${new Date().toISOString().split('T')[0]}`;
        content = options.format === 'csv'
          ? transactionsToCSV(filteredTransactions)
          : JSON.stringify(filteredTransactions, null, 2);
        break;

      case 'budget':
        filename = `orcamentos_${new Date().toISOString().split('T')[0]}`;
        content = options.format === 'csv'
          ? budgetToCSV(data.budgets || [])
          : JSON.stringify(data.budgets, null, 2);
        break;

      case 'savings':
        filename = `economias_${new Date().toISOString().split('T')[0]}`;
        content = options.format === 'csv'
          ? savingsToCSV(data.savings || [])
          : JSON.stringify(data.savings, null, 2);
        break;

      case 'investments':
        filename = `investimentos_${new Date().toISOString().split('T')[0]}`;
        content = options.format === 'csv'
          ? investmentsToCSV(data.investments || [])
          : JSON.stringify(data.investments, null, 2);
        break;

      case 'analytics':
        filename = `analises_${new Date().toISOString().split('T')[0]}`;
        content = options.format === 'csv'
          ? analyticsToCSV(data.analytics || [])
          : JSON.stringify(data.analytics, null, 2);
        break;

      case 'complete':
        filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}`;
        if (options.format === 'csv') {
          // For complete CSV, combine all data sections
          const sections = [];
          if (filteredTransactions.length) sections.push('TRANSAÇÕES\n' + transactionsToCSV(filteredTransactions));
          if (data.budgets?.length) sections.push('ORÇAMENTOS\n' + budgetToCSV(data.budgets));
          if (data.savings?.length) sections.push('METAS DE ECONOMIA\n' + savingsToCSV(data.savings));
          if (data.investments?.length) sections.push('INVESTIMENTOS\n' + investmentsToCSV(data.investments));
          if (data.analytics?.length) sections.push('ANÁLISES\n' + analyticsToCSV(data.analytics));
          content = sections.join('\n\n');
        } else {
          content = createCompleteReport({
            transactions: filteredTransactions,
            budgets: data.budgets || [],
            savings: data.savings || [],
            investments: data.investments || [],
            analytics: data.analytics || [],
          });
        }
        break;
    }

    const extension = options.format === 'csv' ? 'csv' : 'txt';
    const fullFilename = `${filename}.${extension}`;

    try {
      // Write file to device
      await Filesystem.writeFile({
        path: fullFilename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      // Get the file URI for sharing
      const fileUri = await Filesystem.getUri({
        directory: Directory.Documents,
        path: fullFilename,
      });

      // Share the file
      await Share.share({
        title: `Exportar ${fullFilename}`,
        url: fileUri.uri,
      });

      return { success: true, filename: fullFilename };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }, [
    transactionsToCSV,
    budgetToCSV,
    savingsToCSV,
    investmentsToCSV,
    analyticsToCSV,
    createCompleteReport,
  ]);

  return {
    exportData,
  };
};