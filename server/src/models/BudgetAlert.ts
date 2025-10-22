import mongoose, { Schema, Document } from 'mongoose';

export interface IBudgetAlert extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly';
  threshold: number;
  isActive: boolean;
  notifications: {
    push: boolean;
    email: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BudgetAlertSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true
    },
    limit: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly'
    },
    threshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IBudgetAlert>('BudgetAlert', BudgetAlertSchema);
