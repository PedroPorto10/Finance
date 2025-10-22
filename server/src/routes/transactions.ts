import express from 'express';
import Transaction from '../models/Transaction';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);

// Get all transactions
router.get('/', async (req: AuthRequest, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', async (req: AuthRequest, res) => {
  try {
    const transaction = new Transaction({ ...req.body, userId: req.userId });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
