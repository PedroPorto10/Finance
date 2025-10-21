import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Plus, Edit, Trash2, TrendingUp, Calendar, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SavingsGoal } from '@/types/savings';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';

const SavingsGoals = () => {
  const navigate = useNavigate();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addContribution } = useSavingsGoals();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddAmountDialog, setShowAddAmountDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);

  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    name: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    category: 'other',
    targetDate: undefined,
    isActive: true,
    priority: 'medium',
    monthlyContribution: undefined
  });

  const categories: Array<{ value: SavingsGoal['category']; label: string }> = [
    { value: 'emergency', label: 'Emergência' },
    { value: 'vacation', label: 'Viagem' },
    { value: 'house', label: 'Casa' },
    { value: 'car', label: 'Carro' },
    { value: 'education', label: 'Educação' },
    { value: 'retirement', label: 'Aposentadoria' },
    { value: 'other', label: 'Outros' }
  ];

  const priorities: Array<{ value: SavingsGoal['priority']; label: string }> = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Média' },
    { value: 'low', label: 'Baixa' }
  ];

  const createGoal = async () => {
    if (newGoal.name && newGoal.targetAmount && newGoal.targetAmount > 0) {
      // Use the hook function to add the goal
      await addSavingsGoal({
        name: newGoal.name,
        description: newGoal.description,
        targetAmount: newGoal.targetAmount,
        currentAmount: newGoal.currentAmount || 0,
        category: newGoal.category || 'other',
        targetDate: newGoal.targetDate,
        isActive: newGoal.isActive ?? true,
        priority: newGoal.priority || 'medium',
        monthlyContribution: newGoal.monthlyContribution
      });

      // Reset form
      setNewGoal({
        name: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        category: 'other',
        targetDate: undefined,
        isActive: true,
        priority: 'medium',
        monthlyContribution: undefined
      });
      setShowCreateDialog(false);
    }
  };

  const toggleGoal = async (id: string) => {
    const goal = savingsGoals.find(g => g.id === id);
    if (goal) {
      await updateSavingsGoal(id, { isActive: !goal.isActive });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteSavingsGoal(id);
  };

  const addAmountToGoal = async () => {
    if (selectedGoal && contributionAmount > 0) {
      await addContribution({
        goalId: selectedGoal,
        amount: contributionAmount,
        date: new Date(),
        method: 'manual',
        notes: 'Contribuição manual'
      });

      setContributionAmount(0);
      setSelectedGoal(null);
      setShowAddAmountDialog(false);
    }
  };

  const openAddAmountDialog = (goalId: string) => {
    setSelectedGoal(goalId);
    setShowAddAmountDialog(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getCategoryLabel = (category: SavingsGoal['category']) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const getPriorityLabel = (priority: SavingsGoal['priority']) => {
    return priorities.find(p => p.value === priority)?.label || priority;
  };

  const getPriorityColor = (priority: SavingsGoal['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate progress for each goal
  const savingsProgress = savingsGoals.map(goal => {
    const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    return {
      goal,
      percentage: Math.min(100, percentage),
      remaining,
      isComplete: goal.currentAmount >= goal.targetAmount
    };
  }).filter(progress => progress.goal.isActive);

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
            <h1 className="text-2xl font-bold text-foreground">Metas de Economia</h1>
            <p className="text-muted-foreground">Defina e acompanhe seus objetivos</p>
          </div>
        </div>

        {/* Create New Goal */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Criar Meta de Economia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="Ex: Viagem para Europa"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={newGoal.category} onValueChange={(value: SavingsGoal['category']) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetAmount">Valor da Meta (R$)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="5000"
                />
              </div>
              <div>
                <Label htmlFor="currentAmount">Valor Atual (R$)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  value={newGoal.currentAmount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Data Alvo (opcional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={newGoal.priority} onValueChange={(value: SavingsGoal['priority']) => setNewGoal({ ...newGoal, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyContribution">Contribuição Mensal (opcional)</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={newGoal.monthlyContribution || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: parseFloat(e.target.value) || undefined })}
                  placeholder="500"
                />
              </div>
              <Button onClick={createGoal} className="w-full">
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Amount Dialog */}
        <Dialog open={showAddAmountDialog} onOpenChange={setShowAddAmountDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Adicionar Valor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contributionAmount">Valor (R$)</Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  value={contributionAmount || ''}
                  onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                  placeholder="100"
                />
              </div>
              <Button onClick={addAmountToGoal} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Goals List */}
        <div className="space-y-4">
          {savingsProgress.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhuma meta de economia criada</p>
                  <p className="text-sm">Crie sua primeira meta para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            savingsProgress.map((progress) => (
              <Card key={progress.goal.id} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{progress.goal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(progress.goal.category)} •
                        <span className={`ml-1 ${getPriorityColor(progress.goal.priority)}`}>
                          {getPriorityLabel(progress.goal.priority)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddAmountDialog(progress.goal.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        + R$
                      </Button>
                      <Switch
                        checked={progress.goal.isActive}
                        onCheckedChange={() => toggleGoal(progress.goal.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(progress.goal.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>R$ {progress.goal.currentAmount.toFixed(2)}</span>
                      <span>R$ {progress.goal.targetAmount.toFixed(2)}</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                    <div className="text-center text-sm text-muted-foreground">
                      {progress.percentage.toFixed(1)}% concluído
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Restante:</span>
                      <span>R$ {progress.remaining.toFixed(2)}</span>
                    </div>
                    {progress.goal.targetDate && (
                      <div className="flex justify-between">
                        <span>Data alvo:</span>
                        <span>{formatDate(progress.goal.targetDate)}</span>
                      </div>
                    )}
                    {progress.goal.monthlyContribution && (
                      <div className="flex justify-between">
                        <span>Contribuição mensal:</span>
                        <span>R$ {progress.goal.monthlyContribution.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Status indicators */}
                  {progress.percentage >= 100 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-medium">
                      <Target className="h-3 w-3" />
                      <span>Meta alcançada!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsGoals;
