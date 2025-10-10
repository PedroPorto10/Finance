import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppSettings } from '@/lib/appSettings';

// Define the CreditCardInfo interface to match the hook
interface CreditCardInfo {
  id: string;
  name: string;
  last4Digits: string;
  limit: number;
  currentBalance: number;
  dueDate: number;
  isActive: boolean;
  notificationPatterns: string[];
}

const CreditCards = () => {
  const navigate = useNavigate();
  const [creditCards, setCreditCards] = useState<CreditCardInfo[]>([]);

  // Load credit cards on mount
  useEffect(() => {
    const loadCards = async () => {
      const cards = await AppSettings.getCreditCards();
      setCreditCards(cards);
    };
    loadCards();
  }, []);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    bank: '',
    limit: 0,
    currentUsage: 0,
    dueDate: 1,
    closingDate: 1,
    enabled: true,
    color: '#3b82f6'
  });

  const createCard = async () => {
    if (newCard.name && newCard.limit) {
      const newCreditCard: CreditCardInfo = {
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: newCard.name,
        last4Digits: Math.floor(1000 + Math.random() * 9000).toString(),
        limit: newCard.limit,
        currentBalance: newCard.currentUsage || 0,
        dueDate: newCard.dueDate,
        isActive: true,
        notificationPatterns: [newCard.name]
      };

      // Add to state and save
      const updatedCards = [...creditCards, newCreditCard];
      setCreditCards(updatedCards);
      await AppSettings.setCreditCards(updatedCards);

      setNewCard({ name: '', bank: '', limit: 0, currentUsage: 0, dueDate: 1, closingDate: 1, enabled: true, color: '#3b82f6' });
      setShowCreateDialog(false);
    }
  };

  const toggleCard = async (id: string) => {
    const updatedCards = creditCards.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setCreditCards(updatedCards);
    await AppSettings.setCreditCards(updatedCards);
  };

  const deleteCardHandler = async (id: string) => {
    const updatedCards = creditCards.filter(c => c.id !== id);
    setCreditCards(updatedCards);
    await AppSettings.setCreditCards(updatedCards);
  };

  const getUsagePercentage = (card: CreditCardInfo) => {
    return (card.currentBalance / card.limit) * 100;
  };

  const getAvailableLimit = (card: CreditCardInfo) => {
    return card.limit - card.currentBalance;
  };

  const getUsageLevel = (percentage: number) => {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'medium';
    return 'low';
  };

  const getUsageLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTotalLimit = () => {
    return creditCards.reduce((sum, card) => sum + card.limit, 0);
  };

  const getTotalUsage = () => {
    return creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  };

  const colors = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#ef4444', '#f59e0b', '#10b981', '#06b6d4'
  ];

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
            <h1 className="text-2xl font-bold text-foreground">Cartões de Crédito</h1>
            <p className="text-muted-foreground">Monitore seus limites e gastos</p>
          </div>
        </div>

        {/* Summary */}
        <Card className="mb-6 border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {creditCards.filter(c => c.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Cartões Ativos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">
                  R$ {getTotalLimit().toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Limite Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600">
                  {getTotalLimit() > 0 ? ((getTotalUsage() / getTotalLimit()) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Uso Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create New Card */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cartão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Cartão</Label>
                <Input
                  id="name"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  placeholder="Ex: Nubank Roxinho"
                />
              </div>
              <div>
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  value={newCard.bank}
                  onChange={(e) => setNewCard({ ...newCard, bank: e.target.value })}
                  placeholder="Ex: Nubank"
                />
              </div>
              <div>
                <Label htmlFor="limit">Limite (R$)</Label>
                <Input
                  id="limit"
                  type="number"
                  value={newCard.limit}
                  onChange={(e) => setNewCard({ ...newCard, limit: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="currentUsage">Uso Atual (R$)</Label>
                <Input
                  id="currentUsage"
                  type="number"
                  value={newCard.currentUsage}
                  onChange={(e) => setNewCard({ ...newCard, currentUsage: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dueDate">Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="number"
                    value={newCard.dueDate}
                    onChange={(e) => setNewCard({ ...newCard, dueDate: Number(e.target.value) })}
                    placeholder="15"
                    min="1"
                    max="31"
                  />
                </div>
                <div>
                  <Label htmlFor="closingDate">Fechamento</Label>
                  <Input
                    id="closingDate"
                    type="number"
                    value={newCard.closingDate}
                    onChange={(e) => setNewCard({ ...newCard, closingDate: Number(e.target.value) })}
                    placeholder="10"
                    min="1"
                    max="31"
                  />
                </div>
              </div>
              <div>
                <Label>Cor do Cartão</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${newCard.color === color ? 'border-foreground' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCard({ ...newCard, color })}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={createCard} className="w-full">
                Adicionar Cartão
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Existing Cards */}
        <div className="space-y-4">
          {creditCards.map((card) => {
            const usagePercentage = getUsagePercentage(card);
            const availableLimit = getAvailableLimit(card);
            const usageLevel = getUsageLevel(usagePercentage);

            return (
              <Card key={card.id} className={`border-border ${usageLevel === 'high' ? 'border-l-4 border-l-red-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-sm bg-blue-500"
                        />
                        <h3 className="font-semibold text-foreground">{card.name}</h3>
                        {usageLevel === 'high' && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">****{card.last4Digits}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            R$ {card.currentBalance.toLocaleString()} / R$ {card.limit.toLocaleString()}
                          </span>
                          <span className={`font-medium ${getUsageLevelColor(usageLevel)}`}>
                            {usagePercentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={usagePercentage}
                          className="h-2"
                          style={{
                            '--progress-background': usageLevel === 'high' ? '#dc2626' :
                              usageLevel === 'medium' ? '#ca8a04' : '#16a34a'
                          } as React.CSSProperties}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Disponível: R$ {availableLimit.toLocaleString()}</span>
                          <span>Vence dia {card.dueDate}</span>
                        </div>
                        {usageLevel === 'high' && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Alto uso do limite - considere reduzir gastos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Switch
                      checked={card.isActive}
                      onCheckedChange={() => toggleCard(card.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCardHandler(card.id)}
                      className="text-red-500 hover:text-red-600 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tips */}
        <Card className="mt-8 border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-foreground">Dicas para usar cartão com inteligência</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Mantenha o uso abaixo de 30% do limite para um bom score</p>
                  <p>• Pague sempre o valor total da fatura</p>
                  <p>• Configure alertas quando atingir 80% do limite</p>
                  <p>• Use para acumular pontos, não para gastos que não tem dinheiro</p>
                  <p>• Monitore regularmente para evitar fraudes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditCards;