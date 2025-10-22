// Shim for removed Firestore integration.
// The project was migrated away from Firebase/Firestore. This module keeps
// the previous API surface so existing imports don't break the build.
// Each function throws an explicit error to remind developers to migrate
// calls to the new MongoDB-backed services.

export const COLLECTIONS = {
  TRANSACTIONS: 'transactions',
  SAVINGS_GOALS: 'savings_goals',
  INVESTMENTS: 'investments',
  INVESTMENT_POSITIONS: 'investment_positions',
  INCOME_SOURCES: 'income_sources',
  CREDIT_CARDS: 'credit_cards',
  BUDGET_ALERTS: 'budget_alerts',
  BILL_REMINDERS: 'bill_reminders',
  // add other collection names here as needed
} as const;

const shimError = (): never => {
  throw new Error(
    'Firestore integration was removed. Migrate calls to your MongoDB service or replace this shim with an adapter.'
  );
};

export const FirestoreService = {
  subscribeToCollection: (_userId: string, _collection: string, _cb: unknown, _query?: unknown): never => {
    return shimError();
  },
  addDocument: async (_userId: string, _collection: string, _data: unknown): Promise<never> => {
    return shimError();
  },
  updateDocument: async (_userId: string, _collection: string, _id: string, _data: unknown): Promise<never> => {
    return shimError();
  },
  deleteDocument: async (_userId: string, _collection: string, _id: string): Promise<never> => {
    return shimError();
  },
  batchWrite: async (_userId: string, _collection: string, _operations: unknown[]): Promise<never> => {
    return shimError();
  },
  getUserProfile: async (_userId: string): Promise<never> => {
    return shimError();
  },
  updateUserProfile: async (_userId: string, _updates: unknown): Promise<never> => {
    return shimError();
  },
  convertDatesToTimestamps: (_obj: unknown): never => {
    return shimError();
  }
};

export default FirestoreService;
