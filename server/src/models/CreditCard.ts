import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditCard extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  bank: string;
  last4Digits: string;
  limit: number;
  currentBalance: number;
  currentUsage: number;
  dueDate: number;
  closingDate: number;
  isActive: boolean;
  enabled: boolean;
  notificationPatterns: string[];
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreditCardSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    bank: {
      type: String,
      required: true
    },
    last4Digits: {
      type: String,
      required: true,
      match: /^\d{4}$/
    },
    limit: {
      type: Number,
      required: true,
      min: 0
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0
    },
    currentUsage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    closingDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    isActive: {
      type: Boolean,
      default: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    notificationPatterns: [String],
    color: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ICreditCard>('CreditCard', CreditCardSchema);
