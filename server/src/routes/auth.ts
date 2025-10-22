import express, { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Register new user
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const user = new User({
        email,
        password,
        name,
        isAnonymous: false
      });

      await user.save();

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        isAnonymous: false
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          monthlyIncome: user.monthlyIncome,
          isAnonymous: false
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        isAnonymous: false
      });

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          monthlyIncome: user.monthlyIncome,
          isAnonymous: false
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Anonymous login
router.post('/anonymous', async (req: Request, res: Response) => {
  try {
    const user = new User({
      isAnonymous: true,
      password: Math.random().toString(36) // Random password for anonymous users
    });

    await user.save();

    const token = generateToken({
      userId: user._id.toString(),
      isAnonymous: true
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        isAnonymous: true,
        monthlyIncome: user.monthlyIncome
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
