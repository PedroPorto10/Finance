import mongoose, { Schema, Document } from 'mongoose';

export interface IIncomeSource extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'work' | 'freelance' | 'investment' | 'pension' | 'benefit' | 'other';
  contactPattern: string;
  expectedAmount?: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customFrequencyDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSourceSchema: Schema = new Schema(
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
    type: {
      type: String,
      enum: ['work', 'freelance', 'investment', 'pension', 'benefit', 'other'],
      required: true
    },
    contactPattern: {
      type: String,
      required: true,
      trim: true
    },
    expectedAmount: {
      type: Number,
      min: 0
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
      default: 'monthly'
    },
    customFrequencyDays: {
      type: Number,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

IncomeSourceSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model<IIncomeSource>('IncomeSource', IncomeSourceSchema);
