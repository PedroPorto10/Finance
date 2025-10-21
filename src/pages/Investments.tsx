import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, PieChart, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Investment } from '@/types/investment';
import { useInvestments } from '@/hooks/useInvestments';

const Investments = () => {
  const navigate = useNavigate();
  const { investments, addInvestment, deleteInvestment } = useInvestments();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    type: '',
    amount: 0,
    currentValue: 0,
    acquisitionDate: '',
    expectedReturn: 0,
    risk: 'low'
  });

  const investmentTypes = ['Poupança', 'CDB', 'Tesouro Direto', 'LCI/LCA', 'Fundo', 'Ação', 'FII', 'Cripto'];

  const createInvestment = async () => {
    if (newInvestment.name && newInvestment.type && newInvestment.amount) {
      const investment: Investment = {
        id: Date.now().toString(),
        name: newInvestment.name!,
        type: newInvestment.type!,
        amount: newInvestment.amount!,
        currentValue: newInvestment.currentValue || newInvestment.amount!,
        acquisitionDate: newInvestment.acquisitionDate || new Date().toISOString().split('T')[0],
        expectedReturn: newInvestment.expectedReturn || 0,
        risk: newInvestment.risk || 'low'
      };

      // Use the hook function to add the investment
      await addInvestment(investment);

      setNewInvestment({ name: '', type: '', amount: 0, currentValue: 0, acquisitionDate: '', expectedReturn: 0, risk: 'low' });
      setShowCreateDialog(false);
    }
  };

  const deleteInvestmentHandler = async (id: string) => {
    await deleteInvestment(id);
  };

  const getReturn = (investment: Investment) => {
    return investment.currentValue - investment.amount;
  };

  const getReturnPercentage = (investment: Investment) => {
    return ((investment.currentValue - investment.amount) / investment.amount) * 100;
  };

  const getTotalInvested = () => {
    return investments.reduce((sum, inv) => sum + inv.amount, 0);
  };

  const getTotalCurrentValue = () => {
    return investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  };

  const getTotalReturn = () => {
    return getTotalCurrentValue() - getTotalInvested();
  };

  const getTotalReturnPercentage = () => {
    const totalInvested = getTotalInvested();
    if (totalInvested === 0) return 0;
    return (getTotalReturn() / totalInvested) * 100;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  const getRiskLabel = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'Baixo';
      case 'medium': return 'Médio';
      case 'high': return 'Alto';
    }
  };

  const getInvestmentsByType = () => {
    const grouped = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = { amount: 0, currentValue: 0, count: 0 };
      }
      acc[inv.type].amount += inv.amount;
      acc[inv.type].currentValue += inv.currentValue;
      acc[inv.type].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; currentValue: number; count: number }>);

    return Object.entries(grouped).map(([type, data]) => ({
      type,
      amount: data.amount,
      currentValue: data.currentValue,
      count: data.count,
      percentage: (data.amount / getTotalInvested()) * 100,
      return: data.currentValue - data.amount,
      returnPercentage: ((data.currentValue - data.amount) / data.amount) * 100
    }));
  };

  const diversification = getInvestmentsByType();

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
            <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">Acompanhe sua carteira</p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-600">
                  R$ {getTotalCurrentValue().toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Valor Atual</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {getTotalReturn() >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-xl font-bold ${getTotalReturn() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getTotalReturnPercentage().toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Rentabilidade</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Investido: R$ {getTotalInvested().toLocaleString()}
              </p>
              <p className={`text-sm font-medium ${getTotalReturn() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getTotalReturn() >= 0 ? 'Lucro' : 'Prejuízo'}: R$ {Math.abs(getTotalReturn()).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diversification */}
        {diversification.length > 0 && (
          <Card className="mb-6 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="h-5 w-5" />
                Diversificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {diversification.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{item.type} ({item.count})</span>
                    <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {item.amount.toLocaleString()}</span>
                    <span className={item.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.returnPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add Investment */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Investimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Investimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  placeholder="Ex: CDB Inter 120% CDI"
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={newInvestment.type} onValueChange={(value) => setNewInvestment({ ...newInvestment, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Valor Investido (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment({ ...newInvestment, amount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currentValue">Valor Atual (R$)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={newInvestment.currentValue}
                  onChange={(e) => setNewInvestment({ ...newInvestment, currentValue: Number(e.target.value) })}
                  placeholder={newInvestment.amount?.toString() || '0'}
                />
              </div>
              <div>
                <Label htmlFor="expectedReturn">Rentabilidade Esperada (% a.a.)</Label>
                <Input
                  id="expectedReturn"
                  type="number"
                  value={newInvestment.expectedReturn}
                  onChange={(e) => setNewInvestment({ ...newInvestment, expectedReturn: Number(e.target.value) })}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label>Risco</Label>
                <Select value={newInvestment.risk} onValueChange={(value: 'low' | 'medium' | 'high') => setNewInvestment({ ...newInvestment, risk: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createInvestment} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Investment List */}
        <div className="space-y-4">
          {investments.map((investment) => {
            const returnAmount = getReturn(investment);
            const returnPercentage = getReturnPercentage(investment);

            return (
              <Card key={investment.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{investment.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(investment.risk)} bg-gray-100 dark:bg-gray-800`}>
                          {getRiskLabel(investment.risk)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{investment.type}</p>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Investido:</span>
                          <span>R$ {investment.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Atual:</span>
                          <span className="font-medium">R$ {investment.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Retorno:</span>
                          <span className={`font-medium ${returnAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {returnAmount >= 0 ? '+' : ''}R$ {returnAmount.toLocaleString()} ({returnPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        {investment.expectedReturn > 0 && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Expectativa:</span>
                            <span>{investment.expectedReturn}% a.a.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvestmentHandler(investment.id)}
                      className="text-red-500 hover:text-red-600 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Investment Tips */}
        <Card className="mt-8 border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Dicas de investimento</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Diversifique sua carteira entre diferentes tipos de ativos</p>
                  <p>• Invista regularmente, mesmo valores pequenos</p>
                  <p>• Tenha reserva de emergência antes de investir</p>
                  <p>• Estude antes de investir - educação financeira é essencial</p>
                  <p>• Pense no longo prazo e evite decisões emocionais</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Investments;