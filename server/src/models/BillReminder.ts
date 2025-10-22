import mongoose, { Schema, Document } from 'mongoose';

export interface IBillReminder extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customFrequencyDays?: number;
  dueDate: Date;
  nextDueDate: Date;
  reminderDays: number[];
  isActive: boolean;
  isRecurring: boolean;
  contactPattern?: string;
  lastPaidDate?: Date;
  lastPaidAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BillReminderSchema: Schema = new Schema(
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
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
      default: 'monthly'
    },
    customFrequencyDays: Number,
    dueDate: {
      type: Date,
      required: true
    },
    nextDueDate: {
      type: Date,
      required: true,
      index: true
    },
    reminderDays: [Number],
    isActive: {
      type: Boolean,
      default: true
    },
    isRecurring: {
      type: Boolean,
      default: true
    },
    contactPattern: String,
    lastPaidDate: Date,
    lastPaidAmount: Number
  },
  {
    timestamps: true
  }
);

BillReminderSchema.index({ userId: 1, nextDueDate: 1 });

export default mongoose.model<IBillReminder>('BillReminder', BillReminderSchema);
