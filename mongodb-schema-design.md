# MongoDB Schema Design for Finance Tracker App

## Overview
This document outlines the MongoDB collections and schema design for migrating the Finance Tracker app from localStorage to MongoDB.

---

## Collections Structure

### 1. **users** Collection
User authentication and profile information.

```javascript
{
  _id: ObjectId,
  email: String,              // User email
  passwordHash: String,       // Hashed password
  pinHash: String,           // Hashed PIN for app lock (optional)
  profile: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    createdAt: Date,
    updatedAt: Date
  },
  settings: {
    theme: {
      mode: String,           // "light" | "dark" | "system"
      accentColor: String,
      fontSize: String,       // "small" | "medium" | "large"
      reducedMotion: Boolean
    },
    security: {
      pinEnabled: Boolean,
      autoLockDuration: Number,        // minutes
      requireAuthForExport: Boolean,
      requireAuthForSettings: Boolean,
      sessionTimeout: Number           // minutes
    },
    notifications: {
      pushEnabled: Boolean,
      emailEnabled: Boolean
    }
  },
  lastActivity: Date,
  isActive: Boolean
}
```

**Indexes:**
- `email` (unique)
- `isActive`

---

### 2. **transactions** Collection
All financial transactions (PIX, credit card, transfers, etc.)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  transactionId: String,               // Unique transaction ID (for deduplication)
  type: String,                        // "received" | "sent"
  amount: Number,                      // Transaction amount
  date: Date,                          // Transaction date
  contact: String,                     // Contact/merchant name
  description: String,                 // Transaction description
  category: String,                    // "Alimentação" | "Laser" | "Contas" | "Transporte" | "Outros"
  source: String,                      // "pix" | "credit_card" | "debit" | "cash" | "bank_transfer"
  tags: [String],                      // Custom tags

  // Recurring transaction fields
  isRecurring: Boolean,
  recurringId: String,                 // Links recurring transactions together

  // Credit card specific fields
  creditCard: {
    cardId: ObjectId,                  // Reference to creditCards collection
    cardLast4: String,
    installments: Number,
    currentInstallment: Number,
    dueDate: Date
  },

  // Income source association
  incomeSourceId: ObjectId,            // Reference to incomeSources collection (optional)

  // Bill reminder association
  billReminderId: ObjectId,            // Reference to billReminders collection (optional)

  // AI categorization metadata
  aiCategorized: Boolean,
  aiConfidence: Number,                // 0-1 confidence score

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `date` (compound, for date range queries)
- `userId` + `category`
- `userId` + `contact`
- `userId` + `source`
- `transactionId` (unique, for deduplication)
- `recurringId`
- `incomeSourceId`

---

### 3. **incomeSources** Collection
Track different income sources and their patterns.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  name: String,                        // "Empresa XYZ", "Freelance", "Aposentadoria"
  type: String,                        // "work" | "freelance" | "investment" | "pension" | "benefits" | "other"
  contactPattern: String,              // Pattern to match transaction contacts (regex)
  expectedAmount: Number,              // Expected income amount
  frequency: String,                   // "monthly" | "biweekly" | "weekly" | "daily" | "custom"
  customFrequencyDays: Number,         // For custom frequency (every X days)
  isActive: Boolean,

  // Statistics (calculated from transactions)
  stats: {
    totalReceived: Number,
    transactionCount: Number,
    averageAmount: Number,
    lastReceivedDate: Date,
    lastReceivedAmount: Number
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `type`

---

### 4. **budgetAlerts** Collection
Budget limits and alerts for spending categories.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  category: String,                    // "Alimentação" | "Laser" | "Contas" | "Transporte" | "Outros"
  limit: Number,                       // Budget limit amount
  period: String,                      // "monthly" | "weekly" | "daily"
  threshold: Number,                   // Alert threshold percentage (e.g., 80 for 80%)
  isActive: Boolean,

  notifications: {
    push: Boolean,
    email: Boolean
  },

  // Current period tracking
  currentPeriod: {
    startDate: Date,
    endDate: Date,
    spent: Number,
    transactionCount: Number,
    lastAlertSent: Date
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `category`

---

### 5. **savingsGoals** Collection
User savings goals and tracking.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  name: String,
  description: String,
  targetAmount: Number,
  currentAmount: Number,
  category: String,                    // "emergency" | "vacation" | "house" | "car" | "education" | "retirement" | "other"
  targetDate: Date,
  isActive: Boolean,
  priority: String,                    // "low" | "medium" | "high"
  monthlyContribution: Number,

  // Progress tracking
  progress: {
    percentage: Number,
    remaining: Number,
    projectedCompletionDate: Date,
    isOnTrack: Boolean
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `category`
- `userId` + `targetDate`

---

### 6. **savingsContributions** Collection
Track individual contributions to savings goals.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  goalId: ObjectId,                    // Reference to savingsGoals collection
  amount: Number,
  date: Date,
  method: String,                      // "manual" | "automatic" | "transaction"
  transactionId: ObjectId,             // Reference to transactions collection (optional)
  notes: String,
  createdAt: Date
}
```

**Indexes:**
- `userId` + `goalId` + `date`
- `transactionId`

---

### 7. **billReminders** Collection
Recurring bill reminders and tracking.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  name: String,
  description: String,
  amount: Number,                      // Expected amount (optional)
  category: String,                    // "Contas" | "Alimentação" | "Transporte" | "Laser" | "Outros"
  frequency: String,                   // "monthly" | "yearly" | "weekly" | "custom"
  customFrequencyDays: Number,
  dueDate: Date,                       // First due date
  nextDueDate: Date,                   // Next calculated due date
  reminderDays: [Number],              // Days before due date to send reminders
  isActive: Boolean,
  isRecurring: Boolean,
  contactPattern: String,              // Pattern to match transactions (optional)

  // Last payment info
  lastPaidDate: Date,
  lastPaidAmount: Number,
  lastPaidTransactionId: ObjectId,

  // Auto-detection metadata
  autoDetected: Boolean,
  detectionConfidence: Number,         // 0-1 for auto-detected bills

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `nextDueDate`
- `userId` + `category`

---

### 8. **billNotifications** Collection
Track notifications sent for bill reminders.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  reminderId: ObjectId,                // Reference to billReminders collection
  dueDate: Date,
  daysUntilDue: Number,
  amount: Number,
  isPastDue: Boolean,
  wasNotified: Boolean,
  notificationDate: Date,
  notificationMethod: String,          // "push" | "email"
  createdAt: Date
}
```

**Indexes:**
- `userId` + `reminderId` + `dueDate`
- `notificationDate`

---

### 9. **creditCards** Collection
Credit card information and tracking.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  name: String,                        // Custom card name
  bank: String,                        // "C6 Bank", "Nubank", etc.
  last4Digits: String,
  limit: Number,
  dueDate: Number,                     // Day of month (1-31)
  closingDate: Number,                 // Day of month (1-31)
  isActive: Boolean,
  enabled: Boolean,
  color: String,                       // UI color

  // Notification patterns for auto-capture
  notificationPatterns: [String],

  // Current usage (calculated from transactions)
  currentBalance: Number,
  currentUsage: Number,                // Percentage
  availableCredit: Number,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `bank`

---

### 10. **investments** Collection
User investment positions and portfolio.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  investmentTypeId: String,            // Reference to investment types (from static data)
  name: String,                        // Investment name
  amount: Number,                      // Initial investment amount
  currentValue: Number,                // Current market value
  purchaseDate: Date,
  purchasePrice: Number,
  currentPrice: Number,
  quantity: Number,                    // For stocks/funds
  fees: Number,
  isActive: Boolean,
  notes: String,

  // Performance metrics (calculated)
  performance: {
    totalReturn: Number,
    returnPercentage: Number,
    dailyReturn: Number,
    monthlyReturn: Number,
    yearlyReturn: Number,
    netReturn: Number,
    netReturnPercentage: Number
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` + `isActive`
- `userId` + `investmentTypeId`
- `userId` + `purchaseDate`

---

### 11. **investmentPreferences** Collection
User investment preferences and risk profile.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection (unique)
  selectedType: String,                // Preferred investment type ID
  riskTolerance: String,               // "conservative" | "moderate" | "aggressive"
  investmentGoal: String,              // "emergency" | "short_term" | "long_term" | "retirement"
  timeHorizon: Number,                 // In months
  monthlyInvestmentCapacity: Number,

  updatedAt: Date
}
```

**Indexes:**
- `userId` (unique)

---

### 12. **aiInsights** Collection
Store AI-generated insights and recommendations.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  insightType: String,                 // "spending" | "investment" | "budget" | "savings" | "general"

  // Insight content
  title: String,
  message: String,
  recommendations: [String],

  // Context data
  analysisData: {
    monthlyIncome: Number,
    monthlyExpenses: Number,
    savingsRate: Number,
    topCategories: [
      {
        category: String,
        amount: Number,
        percentage: Number
      }
    ],
    recommendedSavings: Number,
    recommendedInvestmentType: String
  },

  // Investment specific
  investmentInsight: {
    recommendedSavings: Number,
    savingsPercentage: Number,
    investmentType: String,
    recommendedInvestmentId: String,
    customInvestmentType: String
  },

  // Metadata
  generatedAt: Date,
  expiresAt: Date,                     // Insights expire after 30 days
  isRead: Boolean,
  isStarred: Boolean,

  createdAt: Date
}
```

**Indexes:**
- `userId` + `generatedAt`
- `userId` + `insightType`
- `expiresAt` (TTL index for auto-deletion)

---

### 13. **analytics** Collection
Pre-computed analytics and aggregations for performance.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  periodType: String,                  // "daily" | "weekly" | "monthly" | "yearly"
  periodStart: Date,
  periodEnd: Date,

  // Spending analytics
  spending: {
    total: Number,
    transactionCount: Number,
    categoryBreakdown: [
      {
        category: String,
        amount: Number,
        percentage: Number,
        transactionCount: Number,
        averageTransaction: Number,
        trend: String,                 // "increasing" | "decreasing" | "stable"
        trendPercentage: Number
      }
    ],
    topMerchants: [
      {
        contact: String,
        amount: Number,
        transactionCount: Number,
        frequency: String
      }
    ]
  },

  // Income analytics
  income: {
    total: Number,
    workIncome: Number,
    otherIncome: Number,
    sourceBreakdown: [
      {
        sourceId: ObjectId,
        sourceName: String,
        type: String,
        amount: Number
      }
    ]
  },

  // Financial health
  health: {
    score: Number,                     // 0-100
    savingsRate: Number,
    spendingConsistency: Number,
    categoryBalance: Number,
    emergencyFund: Number,
    riskLevel: String
  },

  // Net flow
  netIncome: Number,                   // income - spending
  savingsAmount: Number,

  calculatedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `userId` + `periodType` + `periodStart` (compound unique)
- `userId` + `calculatedAt`

---

### 14. **auditLog** Collection
Track important user actions and data changes.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                    // Reference to users collection
  action: String,                      // "login" | "transaction_added" | "budget_exceeded" | "settings_changed"
  entityType: String,                  // "transaction" | "budget" | "savings" | "investment"
  entityId: ObjectId,                  // Reference to affected entity

  details: {
    // Action-specific details (flexible schema)
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  platform: String,                    // "android" | "ios" | "web"

  timestamp: Date
}
```

**Indexes:**
- `userId` + `timestamp`
- `userId` + `action`
- `timestamp` (TTL index to auto-delete old logs)

---

## Data Migration Strategy

### Phase 1: Parallel Write
1. Keep localStorage active
2. Write all new data to both localStorage and MongoDB
3. Monitor for consistency

### Phase 2: Data Sync
1. Export all localStorage data
2. Transform and import into MongoDB
3. Validate data integrity

### Phase 3: Read Migration
1. Gradually switch reads to MongoDB
2. Keep localStorage as fallback
3. Monitor performance

### Phase 4: Complete Migration
1. Switch fully to MongoDB
2. Remove localStorage code
3. Keep export functionality for backups

---

## Key Benefits of MongoDB Schema

1. **Scalability**: No localStorage size limits
2. **Multi-device Sync**: Access data from any device
3. **Better Queries**: Complex aggregations and analytics
4. **Relationships**: Proper foreign key relationships
5. **Backup**: Automatic backup and restore
6. **Performance**: Indexed queries for fast lookups
7. **Analytics**: Pre-computed analytics collection
8. **Security**: Row-level security per user
9. **Audit Trail**: Complete history of changes
10. **TTL Indexes**: Auto-cleanup of old data

---

## Security Considerations

1. **User Isolation**: All queries must filter by `userId`
2. **Password Hashing**: Use bcrypt for passwords and PINs
3. **API Keys**: Store Gemini API key server-side only
4. **Encryption**: Encrypt sensitive fields at rest
5. **Rate Limiting**: Prevent abuse of AI services
6. **Input Validation**: Validate all user inputs
7. **Audit Logging**: Track all sensitive operations

---

## Estimated Collection Sizes

For a single user over 1 year:

| Collection | Estimated Documents | Avg Size | Total |
|-----------|-------------------|----------|-------|
| transactions | 1,000 - 5,000 | 500 bytes | 2.5 MB |
| incomeSources | 3 - 10 | 300 bytes | 3 KB |
| budgetAlerts | 5 - 10 | 200 bytes | 2 KB |
| savingsGoals | 3 - 10 | 250 bytes | 2.5 KB |
| billReminders | 10 - 30 | 300 bytes | 9 KB |
| creditCards | 1 - 5 | 200 bytes | 1 KB |
| investments | 5 - 20 | 300 bytes | 6 KB |
| aiInsights | 50 - 200 | 1 KB | 200 KB |
| analytics | 12 - 365 | 2 KB | 730 KB |

**Total per user: ~3-4 MB/year**

For 10,000 users: ~30-40 GB/year (very manageable)

---

## Next Steps

1. Set up MongoDB Atlas cluster
2. Create collections with indexes
3. Implement backend API with user authentication
4. Update frontend to use API instead of localStorage
5. Implement data migration scripts
6. Add real-time sync functionality
7. Implement backup and restore features
