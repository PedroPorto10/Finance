import express from 'express';
import '../models/User'; // Register User schema
import mongoose from 'mongoose';

// Use the 'Finance' database and 'finance_users' collection explicitly
const FinanceUser = mongoose.connection.useDb('Finance').model('finance_users', mongoose.model('User').schema);

const router = express.Router();

// Test route to add a user

router.post('/test-user', async (req, res) => {
  try {
    const testUser = new FinanceUser({
      email: req.body.email || 'test@example.com',
      password: req.body.password || 'test123',
      name: req.body.name || 'Test User',
      monthlyIncome: req.body.monthlyIncome || 5000,
      isAnonymous: req.body.isAnonymous ?? false
    });

    const savedUser = await testUser.save();
    res.json({
      message: 'Test user created successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      message: 'Error creating test user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;