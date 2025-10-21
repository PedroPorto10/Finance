import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BudgetAlert } from '@/types/budget';
import { useBudgetAlerts } from '@/hooks/useBudgetAlerts';

const BudgetAlerts = () => {
  const navigate = useNavigate();
  const { budgetAlerts, addBudgetAlert, updateBudgetAlert, deleteBudgetAlert } = useBudgetAlerts();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<BudgetAlert>>({
    category: 'Alimentação',
    limit: 0,
    threshold: 80,
    isActive: true,
    period: 'monthly',
    notifications: {
      push: true,
      email: false
    }
  });

  const categories: Array<BudgetAlert['category']> = ['Alimentação', 'Laser', 'Contas', 'Transporte', 'Outros'];

  const createAlert = async () => {
    console.log('BudgetAlerts: createAlert called');
    console.log('BudgetAlerts: newAlert state:', newAlert);
    if (newAlert.category && newAlert.limit && newAlert.limit > 0) {
      console.log('BudgetAlerts: Validation passed, creating new alert');

      // Use the hook function to add the alert
      await addBudgetAlert({
        category: newAlert.category,
        limit: newAlert.limit,
        threshold: newAlert.threshold || 80,
        isActive: newAlert.isActive ?? true,
        period: newAlert.period || 'monthly',
        notifications: newAlert.notifications || { push: true, email: false }
      });

      console.log('BudgetAlerts: Alert added via hook');

      // Reset form
      setNewAlert({
        category: 'Alimentação',
        limit: 0,
        threshold: 80,
        isActive: true,
        period: 'monthly',
        notifications: {
          push: true,
          email: false
        }
      });
      setShowCreateDialog(false);
    }
  };

  const toggleAlert = async (id: string) => {
    console.log('BudgetAlerts: toggleAlert called with id:', id);
    const alert = budgetAlerts.find(a => a.id === id);
    if (alert) {
      // Use the hook function to update the alert
      await updateBudgetAlert(id, { isActive: !alert.isActive });
      console.log('BudgetAlerts: Alert toggled via hook');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    console.log('BudgetAlerts: deleteAlert called with id:', id);
    // Use the hook function to delete the alert
    await deleteBudgetAlert(id);
    console.log('BudgetAlerts: Alert deleted via hook');
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
            <h1 className="text-2xl font-bold text-foreground">Alertas de Orçamento</h1>
            <p className="text-muted-foreground">Configure alertas para suas categorias</p>
          </div>
        </div>

        {/* Create New Alert */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Criar Alerta de Orçamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={newAlert.category} onValueChange={(value: BudgetAlert['category']) => setNewAlert({ ...newAlert, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="limit">Limite (R$)</Label>
                <Input
                  id="limit"
                  type="number"
                  value={newAlert.limit || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, limit: parseFloat(e.target.value) || 0 })}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label htmlFor="threshold">Limite de Alerta (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newAlert.threshold || 80}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) || 80 })}
                  placeholder="80"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="period">Período</Label>
                <Select value={newAlert.period} onValueChange={(value: BudgetAlert['period']) => setNewAlert({ ...newAlert, period: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="push-notifications"
                  checked={newAlert.notifications?.push || false}
                  onCheckedChange={(checked) => setNewAlert({
                    ...newAlert,
                    notifications: {
                      ...newAlert.notifications,
                      push: checked,
                      email: newAlert.notifications?.email || false
                    }
                  })}
                />
                <Label htmlFor="push-notifications">Notificações Push</Label>
              </div>
              <Button onClick={createAlert} className="w-full">
                Criar Alerta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alert List */}
        <div className="space-y-4">
          {budgetAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum alerta de orçamento criado</p>
                  <p className="text-sm">Crie seu primeiro alerta para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            budgetAlerts.map((alert) => (
              <Card key={alert.id} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{alert.category}</h3>
                      <p className="text-sm text-muted-foreground">
                        Limite: R$ {alert.limit.toFixed(2)} • Alerta: {alert.threshold}%
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Período: {alert.period === 'monthly' ? 'Mensal' : alert.period === 'weekly' ? 'Semanal' : 'Diário'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {alert.notifications.push && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Bell className="h-3 w-3" />
                      <span>Notificações ativas</span>
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

export default BudgetAlerts;