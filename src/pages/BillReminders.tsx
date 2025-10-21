import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Edit, Trash2, Clock, DollarSign, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BillReminder } from '@/types/billReminder';
import { useBillReminders } from '@/hooks/useBillReminders';

const BillReminders = () => {
  const navigate = useNavigate();
  const { billReminders, addBillReminder, updateBillReminder, deleteBillReminder, markBillAsPaid } = useBillReminders();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<BillReminder>>({
    name: '',
    description: '',
    amount: undefined,
    category: 'Contas',
    frequency: 'monthly',
    dueDate: new Date(),
    reminderDays: [3],
    isActive: true,
    isRecurring: true
  });

  const categories: Array<BillReminder['category']> = ['Contas', 'Alimentação', 'Transporte', 'Laser', 'Outros'];

  const createReminder = async () => {
    if (newReminder.name && newReminder.dueDate) {
      // Use the hook function to add the reminder
      await addBillReminder({
        name: newReminder.name,
        description: newReminder.description,
        amount: newReminder.amount,
        category: newReminder.category || 'Contas',
        frequency: newReminder.frequency || 'monthly',
        dueDate: newReminder.dueDate,
        reminderDays: newReminder.reminderDays || [3],
        isActive: newReminder.isActive ?? true,
        isRecurring: newReminder.isRecurring ?? true,
        contactPattern: newReminder.contactPattern
      });

      setNewReminder({
        name: '',
        description: '',
        amount: undefined,
        category: 'Contas',
        frequency: 'monthly',
        dueDate: new Date(),
        reminderDays: [3],
        isActive: true,
        isRecurring: true
      });
      setShowCreateDialog(false);
    }
  };

  const toggleReminder = async (id: string) => {
    const reminder = billReminders.find(r => r.id === id);
    if (reminder) {
      await updateBillReminder(id, { isActive: !reminder.isActive });
    }
  };

  const deleteReminderHandler = async (id: string) => {
    await deleteBillReminder(id);
  };

  const markAsPaidHandler = async (id: string) => {
    await markBillAsPaid(id);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <h1 className="text-2xl font-bold text-foreground">Lembretes de Contas</h1>
            <p className="text-muted-foreground">Gerencie seus lembretes de pagamento</p>
          </div>
        </div>

        {/* Create New Reminder */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lembrete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Criar Lembrete de Conta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={newReminder.name}
                  onChange={(e) => setNewReminder({ ...newReminder, name: e.target.value })}
                  placeholder="Ex: Conta de Luz"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={newReminder.category} onValueChange={(value: BillReminder['category']) => setNewReminder({ ...newReminder, category: value })}>
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
                <Label htmlFor="amount">Valor (opcional)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newReminder.amount || ''}
                  onChange={(e) => setNewReminder({ ...newReminder, amount: parseFloat(e.target.value) || undefined })}
                  placeholder="120.00"
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newReminder.dueDate?.toISOString().split('T')[0]}
                  onChange={(e) => setNewReminder({ ...newReminder, dueDate: new Date(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={newReminder.frequency} onValueChange={(value: BillReminder['frequency']) => setNewReminder({ ...newReminder, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={newReminder.isRecurring || false}
                  onCheckedChange={(checked) => setNewReminder({ ...newReminder, isRecurring: checked })}
                />
                <Label htmlFor="recurring">Lembrete Recorrente</Label>
              </div>
              <Button onClick={createReminder} className="w-full">
                Criar Lembrete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reminder List */}
        <div className="space-y-4">
          {billReminders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum lembrete de conta criado</p>
                  <p className="text-sm">Crie seu primeiro lembrete para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            billReminders.map((reminder) => {
              const daysUntil = getDaysUntilDue(reminder.nextDueDate);
              const isOverdue = daysUntil < 0;
              const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

              return (
                <Card key={reminder.id} className={`border-border ${isOverdue ? 'border-red-500' : isUpcoming ? 'border-yellow-500' : ''}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{reminder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {reminder.amount && `R$ ${reminder.amount.toFixed(2)} • `}
                          {reminder.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Próximo vencimento: {formatDate(reminder.nextDueDate)}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-red-500 font-medium">
                            Venceu há {Math.abs(daysUntil)} dia{Math.abs(daysUntil) > 1 ? 's' : ''}
                          </p>
                        )}
                        {isUpcoming && daysUntil > 0 && (
                          <p className="text-xs text-yellow-600 font-medium">
                            Vence em {daysUntil} dia{daysUntil > 1 ? 's' : ''}
                          </p>
                        )}
                        {daysUntil === 0 && (
                          <p className="text-xs text-orange-600 font-medium">
                            Vence hoje!
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {reminder.amount && (isOverdue || daysUntil === 0) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsPaidHandler(reminder.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Pago
                          </Button>
                        )}
                        <Switch
                          checked={reminder.isActive}
                          onCheckedChange={() => toggleReminder(reminder.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReminderHandler(reminder.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {reminder.reminderDays.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Bell className="h-3 w-3" />
                        <span>Lembrar {reminder.reminderDays.join(', ')} dia{reminder.reminderDays.length > 1 ? 's' : ''} antes</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BillReminders;