import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestment extends Document {
  userId: mongoose.Types.ObjectId;
  typeId: string;
  name: string;
  amount: number;
  purchaseDate: Date;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  fees: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    typeId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    purchaseDate: {
      type: Date,
      required: true
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    fees: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: String
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IInvestment>('Investment', InvestmentSchema);
