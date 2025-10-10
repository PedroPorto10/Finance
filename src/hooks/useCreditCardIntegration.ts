import { useState, useEffect, useCallback } from 'react';
import { Transaction, CreditCardTransaction } from '@/types/transaction';
import { CreditCard } from '@/types/creditCard';
import { settingsService } from '@/lib/settingsService';

interface CreditCardSpending {
  cardId: string;
  totalSpent: number;
  availableCredit: number;
  utilizationPercentage: number;
  transactionCount: number;
  categories: { [category: string]: number };
}

export const useCreditCardIntegration = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load credit cards on mount
  useEffect(() => {
    let mounted = true;

    const loadCreditCards = async () => {
      console.log('useCreditCardIntegration: Loading credit cards...');
      const cards = await settingsService.getCreditCards();

      if (mounted) {
        console.log('useCreditCardIntegration: Loaded credit cards:', cards);
        setCreditCards(cards);
        setIsInitialized(true);
      }
    };

    loadCreditCards();

    return () => {
      mounted = false;
    };
  }, []);

  // Add a new credit card
  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id'>) => {
    const newCard = await settingsService.addCreditCard(card);
    setCreditCards(prev => [...prev, newCard]);
    return newCard;
  }, []);

  // Update a credit card
  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    const updated = await settingsService.updateCreditCard(id, updates);
    if (updated) {
      setCreditCards(prev => prev.map(c => c.id === id ? updated : c));
    }
  }, []);

  // Delete a credit card
  const deleteCreditCard = useCallback(async (id: string) => {
    const success = await settingsService.deleteCreditCard(id);
    if (success) {
      setCreditCards(prev => prev.filter(c => c.id !== id));
    }
  }, []);

  // Parse credit card notification
  const parseCreditCardNotification = useCallback((notificationText: string): Partial<CreditCardTransaction> | null => {
    try {
      const text = notificationText.toLowerCase();

      // Common patterns for Brazilian credit card notifications
      const patterns = {
        // C6 Bank patterns
        c6: {
          purchase: /compra\s+aprovada.*?r\$\s*([\d.,]+).*?em\s+(.+?)(?:\s+parcelada|$)/i,
          installment: /compra\s+parcelada.*?r\$\s*([\d.,]+).*?(\d+)\/(\d+).*?em\s+(.+)/i,
        },
        // Generic patterns for other banks
        generic: {
          purchase: /(?:compra|pagamento).*?r\$\s*([\d.,]+).*?(?:em|no|na)\s+(.+)/i,
          approved: /aprovad[ao].*?r\$\s*([\d.,]+).*?(.+)/i,
          installment: /parcel.*?(\d+)\/(\d+).*?r\$\s*([\d.,]+)/i,
        }
      };

      let match;
      let amount: number | undefined;
      let contact: string | undefined;
      let installments: number | undefined;
      let currentInstallment: number | undefined;

      // Try C6 Bank patterns first
      match = text.match(patterns.c6.installment);
      if (match) {
        amount = parseFloat(match[1].replace(',', '.'));
        currentInstallment = parseInt(match[2]);
        installments = parseInt(match[3]);
        contact = match[4].trim();
      } else {
        match = text.match(patterns.c6.purchase);
        if (match) {
          amount = parseFloat(match[1].replace(',', '.'));
          contact = match[2].trim();
        }
      }

      // Try generic patterns if no match
      if (!match) {
        for (const pattern of Object.values(patterns.generic)) {
          match = text.match(pattern);
          if (match) {
            if (pattern === patterns.generic.installment) {
              currentInstallment = parseInt(match[1]);
              installments = parseInt(match[2]);
              amount = parseFloat(match[3].replace(',', '.'));
            } else {
              amount = parseFloat(match[1].replace(',', '.'));
              contact = match[2]?.trim();
            }
            break;
          }
        }
      }

      if (!amount || amount <= 0) return null;

      // Try to identify which card based on notification content
      const matchingCard = creditCards.find(card =>
        card.isActive && card.notificationPatterns.some(pattern =>
          notificationText.toLowerCase().includes(pattern.toLowerCase())
        )
      );

      // Clean up contact name
      if (contact) {
        contact = contact
          .replace(/[^\w\s]/g, '') // Remove special chars
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim()
          .substring(0, 50); // Limit length
      }

      const creditCardTransaction: Partial<CreditCardTransaction> = {
        source: 'credit_card',
        type: 'sent',
        amount,
        contact: contact || 'Compra no cartão',
        date: new Date(),
        cardLast4: matchingCard?.last4Digits,
        installments,
        currentInstallment,
      };

      return creditCardTransaction;
    } catch (error) {
      console.error('Error parsing credit card notification:', error);
      return null;
    }
  }, [creditCards]);

  // Get credit card spending analysis
  const getCreditCardSpending = useCallback((transactions: Transaction[]): CreditCardSpending[] => {
    const cardSpending = new Map<string, {
      totalSpent: number;
      transactionCount: number;
      categories: { [category: string]: number };
    }>();

    // Group credit card transactions by card
    transactions
      .filter(t => t.type === 'sent' && t.source === 'credit_card')
      .forEach(transaction => {
        const cardTransaction = transaction as CreditCardTransaction;
        const cardKey = cardTransaction.cardLast4 || 'unknown';

        if (!cardSpending.has(cardKey)) {
          cardSpending.set(cardKey, {
            totalSpent: 0,
            transactionCount: 0,
            categories: {},
          });
        }

        const spending = cardSpending.get(cardKey)!;
        spending.totalSpent += transaction.amount;
        spending.transactionCount += 1;

        if (transaction.category) {
          spending.categories[transaction.category] = (spending.categories[transaction.category] || 0) + transaction.amount;
        }
      });

    // Convert to final format
    return Array.from(cardSpending.entries()).map(([cardLast4, spending]) => {
      const card = creditCards.find(c => c.last4Digits === cardLast4);
      const cardId = card?.id || cardLast4;
      const limit = card?.limit || 0;
      const availableCredit = Math.max(0, limit - spending.totalSpent);
      const utilizationPercentage = limit > 0 ? (spending.totalSpent / limit) * 100 : 0;

      return {
        cardId,
        totalSpent: spending.totalSpent,
        availableCredit,
        utilizationPercentage,
        transactionCount: spending.transactionCount,
        categories: spending.categories,
      };
    });
  }, [creditCards]);

  // Get credit utilization warnings
  const getCreditUtilizationWarnings = useCallback((spending: CreditCardSpending[]): string[] => {
    const warnings: string[] = [];

    spending.forEach(cardSpending => {
      const card = creditCards.find(c => c.id === cardSpending.cardId);
      const cardName = card ? `${card.name} (****${card.last4Digits})` : 'Cartão desconhecido';

      if (cardSpending.utilizationPercentage > 90) {
        warnings.push(`⚠️ ${cardName}: ${cardSpending.utilizationPercentage.toFixed(1)}% do limite utilizado`);
      } else if (cardSpending.utilizationPercentage > 70) {
        warnings.push(`⚡ ${cardName}: ${cardSpending.utilizationPercentage.toFixed(1)}% do limite utilizado`);
      }
    });

    return warnings;
  }, [creditCards]);

  // Get upcoming due dates
  const getUpcomingDueDates = useCallback((): { card: CreditCardInfo; daysUntilDue: number }[] => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return creditCards
      .filter(card => card.isActive)
      .map(card => {
        let dueDate = new Date(currentYear, currentMonth, card.dueDate);

        // If due date has passed this month, calculate for next month
        if (card.dueDate <= currentDay) {
          dueDate = new Date(currentYear, currentMonth + 1, card.dueDate);
        }

        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return { card, daysUntilDue };
      })
      .filter(({ daysUntilDue }) => daysUntilDue <= 7) // Only show cards due within 7 days
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }, [creditCards]);

  // Process notification and create transaction
  const processNotificationTransaction = useCallback((notificationText: string): CreditCardTransaction | null => {
    const parsedTransaction = parseCreditCardNotification(notificationText);

    if (!parsedTransaction) return null;

    // Create full transaction object
    const transaction: CreditCardTransaction = {
      id: `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: 'credit_card',
      type: 'sent',
      amount: parsedTransaction.amount!,
      date: new Date(),
      contact: parsedTransaction.contact!,
      cardLast4: parsedTransaction.cardLast4,
      installments: parsedTransaction.installments,
      currentInstallment: parsedTransaction.currentInstallment,
      category: 'Outros', // Will be categorized by AI later
    };

    return transaction;
  }, [parseCreditCardNotification]);

  return {
    creditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    parseCreditCardNotification,
    getCreditCardSpending,
    getCreditUtilizationWarnings,
    getUpcomingDueDates,
    processNotificationTransaction,
  };
};