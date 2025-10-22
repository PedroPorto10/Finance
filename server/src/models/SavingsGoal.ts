import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate?: Date;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  monthlyContribution?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema: Schema = new Schema(
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
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    category: {
      type: String,
      required: true
    },
    targetDate: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    monthlyContribution: Number
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
