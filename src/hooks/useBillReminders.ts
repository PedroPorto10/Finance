import { useState, useEffect, useCallback } from 'react';
import { BillReminder, BillReminderNotification, RecurringBillPattern } from '@/types/billReminder';
import { Transaction } from '@/types/transaction';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SimpleStorage } from '@/lib/simpleStorage';

const REMINDERS_STORAGE_KEY = 'bill-reminders';
const NOTIFICATIONS_STORAGE_KEY = 'bill-notifications';

export const useBillReminders = () => {
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);
  const [notifications, setNotifications] = useState<BillReminderNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data on mount
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      console.log('useBillReminders: Loading reminders and notifications...');

      const [storedReminders, storedNotifications] = await Promise.all([
        SimpleStorage.getObjectAsync(REMINDERS_STORAGE_KEY, []),
        SimpleStorage.getObjectAsync(NOTIFICATIONS_STORAGE_KEY, [])
      ]);

      if (mounted) {
        const reminders = storedReminders.map((reminder: BillReminder & { dueDate: string; nextDueDate: string; lastPaidDate?: string; createdAt: string; updatedAt: string }) => ({
          ...reminder,
          dueDate: new Date(reminder.dueDate),
          nextDueDate: new Date(reminder.nextDueDate),
          lastPaidDate: reminder.lastPaidDate ? new Date(reminder.lastPaidDate) : undefined,
          createdAt: new Date(reminder.createdAt),
          updatedAt: new Date(reminder.updatedAt),
        }));

        const notifs = storedNotifications.map((notif: BillReminderNotification & { dueDate: string; notificationDate?: string }) => ({
          ...notif,
          dueDate: new Date(notif.dueDate),
          notificationDate: notif.notificationDate ? new Date(notif.notificationDate) : undefined,
        }));

        console.log('useBillReminders: Loaded reminders:', reminders);
        console.log('useBillReminders: Loaded notifications:', notifs);
        setBillReminders(reminders);
        setNotifications(notifs);
        setIsInitialized(true);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Persist reminders using SimpleStorage
  const persistBillReminders = useCallback(async (reminders: BillReminder[]) => {
    console.log('useBillReminders: Saving bill reminders:', reminders);
    const success = await SimpleStorage.setObjectAsync(REMINDERS_STORAGE_KEY, reminders);
    if (!success) {
      console.error('useBillReminders: Failed to save bill reminders');
    }
  }, []);

  // Persist notifications using SimpleStorage
  const persistNotifications = useCallback(async (notifs: BillReminderNotification[]) => {
    console.log('useBillReminders: Saving notifications:', notifs);
    const success = await SimpleStorage.setObjectAsync(NOTIFICATIONS_STORAGE_KEY, notifs);
    if (!success) {
      console.error('useBillReminders: Failed to save notifications');
    }
  }, []);

  // Calculate next due date
  const calculateNextDueDate = useCallback((reminder: BillReminder): Date => {
    const now = new Date();
    const nextDue = new Date(reminder.dueDate);

    if (nextDue <= now) {
      switch (reminder.frequency) {
        case 'monthly':
          while (nextDue <= now) {
            nextDue.setMonth(nextDue.getMonth() + 1);
          }
          break;
        case 'yearly':
          while (nextDue <= now) {
            nextDue.setFullYear(nextDue.getFullYear() + 1);
          }
          break;
        case 'weekly':
          while (nextDue <= now) {
            nextDue.setDate(nextDue.getDate() + 7);
          }
          break;
        case 'custom': {
          const days = reminder.customFrequencyDays || 30;
          while (nextDue <= now) {
            nextDue.setDate(nextDue.getDate() + days);
          }
          break;
        }
      }
    }

    return nextDue;
  }, []);

  // Add a new bill reminder
  const addBillReminder = useCallback(async (reminder: Omit<BillReminder, 'id' | 'nextDueDate' | 'createdAt' | 'updatedAt'>) => {
    const newReminder: BillReminder = {
      ...reminder,
      id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nextDueDate: calculateNextDueDate(reminder as BillReminder),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = [...billReminders, newReminder];
    setBillReminders(updated);
    await persistBillReminders(updated);
    return newReminder;
  }, [billReminders, persistBillReminders, calculateNextDueDate]);

  // Update a bill reminder
  const updateBillReminder = useCallback(async (id: string, updates: Partial<BillReminder>) => {
    const updated = billReminders.map(reminder => {
      if (reminder.id === id) {
        const updatedReminder = { ...reminder, ...updates, updatedAt: new Date() };
        return {
          ...updatedReminder,
          nextDueDate: calculateNextDueDate(updatedReminder),
        };
      }
      return reminder;
    });
    setBillReminders(updated);
    await persistBillReminders(updated);
  }, [billReminders, persistBillReminders, calculateNextDueDate]);

  // Delete a bill reminder
  const deleteBillReminder = useCallback(async (id: string) => {
    const updated = billReminders.filter(reminder => reminder.id !== id);
    setBillReminders(updated);
    await persistBillReminders(updated);

    // Also remove related notifications
    const updatedNotifications = notifications.filter(notif => notif.reminderId !== id);
    setNotifications(updatedNotifications);
    await persistNotifications(updatedNotifications);
  }, [billReminders, notifications, persistBillReminders, persistNotifications]);

  // Mark a bill as paid
  const markBillAsPaid = useCallback(async (id: string, amount?: number, paidDate?: Date) => {
    const reminder = billReminders.find(r => r.id === id);
    if (!reminder) return;

    const paymentDate = paidDate || new Date();
    const updatedReminder = {
      ...reminder,
      lastPaidDate: paymentDate,
      lastPaidAmount: amount || reminder.amount,
      nextDueDate: reminder.isRecurring ? calculateNextDueDate({
        ...reminder,
        dueDate: paymentDate
      }) : reminder.nextDueDate,
      updatedAt: new Date(),
    };

    setBillReminders(prev => {
      const updated = prev.map(r =>
        r.id === id ? updatedReminder : r
      );
      persistBillReminders(updated);
      return updated;
    });
  }, [persistBillReminders, calculateNextDueDate]);

  // Detect recurring bills from transactions
  const detectRecurringBills = useCallback((transactions: Transaction[]): RecurringBillPattern[] => {
    const patterns = new Map<string, {
      transactions: Transaction[];
      amounts: number[];
      dates: Date[];
    }>();

    // Group transactions by contact
    transactions
      .filter(t => t.type === 'sent' && t.amount > 10) // Filter out small transactions
      .forEach(transaction => {
        const key = transaction.contact.toLowerCase();
        if (!patterns.has(key)) {
          patterns.set(key, { transactions: [], amounts: [], dates: [] });
        }
        const pattern = patterns.get(key)!;
        pattern.transactions.push(transaction);
        pattern.amounts.push(transaction.amount);
        pattern.dates.push(transaction.date);
      });

    const recurringPatterns: RecurringBillPattern[] = [];

    patterns.forEach((data, contactKey) => {
      if (data.transactions.length < 2) return;

      // Sort by date
      data.transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      data.dates.sort((a, b) => a.getTime() - b.getTime());

      // Calculate intervals between transactions
      const intervals: number[] = [];
      for (let i = 1; i < data.dates.length; i++) {
        const daysDiff = Math.round(
          (data.dates[i].getTime() - data.dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        );
        intervals.push(daysDiff);
      }

      // Check if intervals are consistent (within ±5 days)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const isConsistent = intervals.every(interval =>
        Math.abs(interval - avgInterval) <= 5
      );

      if (isConsistent && avgInterval >= 20) { // At least 20 days apart
        const averageAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const lastTransaction = data.transactions[data.transactions.length - 1];
        const nextExpectedDate = new Date(lastTransaction.date);
        nextExpectedDate.setDate(nextExpectedDate.getDate() + avgInterval);

        // Calculate confidence based on consistency and number of transactions
        const consistency = 1 - (Math.max(...intervals) - Math.min(...intervals)) / avgInterval;
        const frequencyBonus = Math.min(data.transactions.length / 6, 1); // Max at 6 transactions
        const confidence = Math.min(consistency * 0.7 + frequencyBonus * 0.3, 0.95);

        if (confidence >= 0.5) { // Only suggest if confidence >= 50%
          recurringPatterns.push({
            contactPattern: data.transactions[0].contact,
            category: lastTransaction.category || 'Contas',
            averageAmount,
            frequency: Math.round(avgInterval),
            confidence,
            lastTransactionDate: lastTransaction.date,
            nextExpectedDate,
          });
        }
      }
    });

    return recurringPatterns.sort((a, b) => b.confidence - a.confidence);
  }, []);

  // Check for upcoming bills and send notifications
  const checkUpcomingBills = useCallback(async () => {
    const now = new Date();
    const upcomingNotifications: BillReminderNotification[] = [];

    for (const reminder of billReminders.filter(r => r.isActive)) {
      for (const reminderDays of reminder.reminderDays) {
        const notificationDate = new Date(reminder.nextDueDate);
        notificationDate.setDate(notificationDate.getDate() - reminderDays);

        if (notificationDate <= now && notificationDate > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
          const existingNotification = notifications.find(n =>
            n.reminderId === reminder.id &&
            Math.abs(n.dueDate.getTime() - reminder.nextDueDate.getTime()) < 24 * 60 * 60 * 1000
          );

          if (!existingNotification || !existingNotification.wasNotified) {
            const daysUntilDue = Math.max(0, Math.ceil(
              (reminder.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ));

            const notification: BillReminderNotification = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              reminderId: reminder.id,
              dueDate: reminder.nextDueDate,
              daysUntilDue,
              amount: reminder.amount,
              isPastDue: daysUntilDue < 0,
              wasNotified: false,
              notificationDate: now,
            };

            upcomingNotifications.push(notification);
          }
        }
      }
    }

    // Send push notifications
    if (upcomingNotifications.length > 0) {
      try {
        const pushNotifications = upcomingNotifications.map((notif, index) => {
          const reminder = billReminders.find(r => r.id === notif.reminderId);
          if (!reminder) return null;

          return {
            title: 'Lembrete de Conta',
            body: notif.isPastDue
              ? `${reminder.name} está em atraso! Vencimento: ${notif.dueDate.toLocaleDateString('pt-BR')}`
              : notif.daysUntilDue === 0
              ? `${reminder.name} vence hoje! ${notif.amount ? `Valor: R$ ${notif.amount.toFixed(2)}` : ''}`
              : `${reminder.name} vence em ${notif.daysUntilDue} dia${notif.daysUntilDue > 1 ? 's' : ''}`,
            id: Date.now() + index,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              reminderId: reminder.id,
              type: 'bill_reminder'
            }
          };
        }).filter(Boolean) as Array<{
          title: string;
          body: string;
          id: number;
          schedule: { at: Date };
          extra: { reminderId: string; type: string };
        }>;

        if (pushNotifications.length > 0) {
          await LocalNotifications.schedule({ notifications: pushNotifications });

          // Mark notifications as sent
          setNotifications(prev => {
            const updated = [
              ...prev.filter(n => !upcomingNotifications.find(un =>
                un.reminderId === n.reminderId &&
                Math.abs(un.dueDate.getTime() - n.dueDate.getTime()) < 24 * 60 * 60 * 1000
              )),
              ...upcomingNotifications.map(n => ({ ...n, wasNotified: true }))
            ];
            persistNotifications(updated);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error sending bill reminder notifications:', error);
      }
    }

    return upcomingNotifications;
  }, [billReminders, notifications, persistNotifications]);

  // Get upcoming bills
  const getUpcomingBills = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return billReminders
      .filter(reminder =>
        reminder.isActive &&
        reminder.nextDueDate >= now &&
        reminder.nextDueDate <= futureDate
      )
      .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }, [billReminders]);

  // Get overdue bills
  const getOverdueBills = useCallback(() => {
    const now = new Date();
    return billReminders
      .filter(reminder => reminder.isActive && reminder.nextDueDate < now)
      .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }, [billReminders]);

  return {
    billReminders,
    notifications,
    addBillReminder,
    updateBillReminder,
    deleteBillReminder,
    markBillAsPaid,
    detectRecurringBills,
    checkUpcomingBills,
    getUpcomingBills,
    getOverdueBills,
    calculateNextDueDate,
  };
};