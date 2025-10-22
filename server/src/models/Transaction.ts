import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'received' | 'sent';
  amount: number;
  date: Date;
  contact: string;
  description?: string;
  category?: 'Alimentação' | 'Laser' | 'Contas' | 'Transporte' | 'Outros';
  source?: 'pix' | 'credit_card' | 'debit' | 'cash' | 'bank_transfer';
  tags?: string[];
  isRecurring?: boolean;
  recurringId?: string;
  // Credit card specific fields
  cardLast4?: string;
  installments?: number;
  currentInstallment?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['received', 'sent'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['Alimentação', 'Laser', 'Contas', 'Transporte', 'Outros']
    },
    source: {
      type: String,
      enum: ['pix', 'credit_card', 'debit', 'cash', 'bank_transfer']
    },
    tags: [String],
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringId: String,
    // Credit card fields
    cardLast4: String,
    installments: Number,
    currentInstallment: Number,
    dueDate: Date
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
