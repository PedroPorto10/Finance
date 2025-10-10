import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, TrendingUp, AlertCircle, CheckCircle, Target, PiggyBank, Calculator, CreditCard } from 'lucide-react';
import { FinancialHealth } from '@/types/analytics';

interface FinancialHealthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  financialHealth: FinancialHealth;
}

export const FinancialHealthDialog: React.FC<FinancialHealthDialogProps> = ({
  open,
  onOpenChange,
  financialHealth
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (score >= 40) return <AlertCircle className="h-6 w-6 text-yellow-600" />;
    return <AlertCircle className="h-6 w-6 text-red-600" />;
  };

  const healthTips = [
    {
      icon: <PiggyBank className="h-5 w-5 text-green-600" />,
      title: "Aumentar Taxa de Economia",
      description: "Tente economizar pelo menos 20% da sua renda mensal",
      tips: [
        "Automatize transferências para poupança logo após receber o salário",
        "Use a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança",
        "Cancele assinaturas não utilizadas",
        "Compare preços antes de compras grandes"
      ]
    },
    {
      icon: <Calculator className="h-5 w-5 text-blue-600" />,
      title: "Melhorar Consistência de Gastos",
      description: "Mantenha gastos mais estáveis dia a dia",
      tips: [
        "Crie um orçamento mensal e acompanhe semanalmente",
        "Evite compras por impulso - espere 24h antes de comprar",
        "Use o método envelope: separe dinheiro por categoria",
        "Monitore gastos diariamente com aplicativos"
      ]
    },
    {
      icon: <Target className="h-5 w-5 text-purple-600" />,
      title: "Balancear Categorias de Gastos",
      description: "Diversifique gastos entre diferentes categorias",
      tips: [
        "Não gaste mais de 30% em uma única categoria",
        "Limite gastos com laser para 10-15% da renda",
        "Invista em qualidade de vida (saúde, educação)",
        "Revise e ajuste limites mensalmente"
      ]
    },
    {
      icon: <Shield className="h-5 w-5 text-orange-600" />,
      title: "Construir Reserva de Emergência",
      description: "Tenha 3-6 meses de gastos guardados",
      tips: [
        "Comece com meta de R$ 1.000 para emergências básicas",
        "Guarde a reserva em conta que renda 100% do CDI",
        "Não use a reserva para oportunidades, só emergências",
        "Aumente gradualmente até 6 meses de gastos"
      ]
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-indigo-600" />,
      title: "Dicas Gerais de Investimento",
      description: "Faça seu dinheiro trabalhar para você",
      tips: [
        "Quite dívidas de cartão antes de investir",
        "Diversifique: renda fixa, ações, fundos imobiliários",
        "Invista mensalmente, mesmo valores pequenos",
        "Estude antes de investir - educação financeira é essencial"
      ]
    },
    {
      icon: <CreditCard className="h-5 w-5 text-red-600" />,
      title: "Controle de Cartão de Crédito",
      description: "Use o cartão com inteligência",
      tips: [
        "Nunca use mais de 30% do limite disponível",
        "Pague sempre o valor total da fatura",
        "Configure alertas quando atingir 80% do limite",
        "Use o cartão para ganhar pontos, não para gastos que não tem dinheiro"
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Saúde Financeira
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Overview */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getScoreIcon(financialHealth.score)}
              <span className={`text-2xl font-bold ${getScoreColor(financialHealth.score)}`}>
                {financialHealth.score}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {financialHealth.riskLevel === 'low' ? 'Excelente saúde financeira!' :
               financialHealth.riskLevel === 'medium' ? 'Boa saúde financeira, mas pode melhorar' :
               'Atenção necessária - foque nas dicas abaixo'}
            </p>
          </div>

          {/* Detailed Factors */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Detalhamento da Pontuação:</h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Economia</span>
                <span className="font-medium">{financialHealth.factors.savingsRate.toFixed(1)}%</span>
              </div>
              <Progress value={financialHealth.factors.savingsRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consistência de Gastos</span>
                <span className="font-medium">{financialHealth.factors.spendingConsistency.toFixed(1)}%</span>
              </div>
              <Progress value={financialHealth.factors.spendingConsistency} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Balanceamento de Categorias</span>
                <span className="font-medium">{financialHealth.factors.categoryBalance.toFixed(1)}%</span>
              </div>
              <Progress value={financialHealth.factors.categoryBalance} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Reserva de Emergência</span>
                <span className="font-medium">{financialHealth.factors.emergencyFund.toFixed(1)}%</span>
              </div>
              <Progress value={financialHealth.factors.emergencyFund} className="h-2" />
            </div>
          </div>

          {/* Tips Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">💡 Dicas para Melhorar sua Saúde Financeira:</h3>

            {healthTips.map((tip, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {tip.icon}
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
                <ul className="space-y-1">
                  {tip.tips.map((tipItem, tipIndex) => (
                    <li key={tipIndex} className="text-xs flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span>{tipItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Entendi, vou colocar em prática!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};