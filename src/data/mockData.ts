import { Receipt, User, Budget, DuplicateAlert, SpendingTrendPoint } from '../types';

export const mockUser: User = {
  id: 'usr_me',
  name: 'Personal Vault',
  email: 'user@receiptradar.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currencyPreference: 'INR',
  monthlyBudget: 80000,
  encryptionKeyFingerprint: 'SHA256:7e9a8f4c21b069d35a821eef00c921389da442',
  role: 'user',
  twoFactorEnabled: true,
};

// Completely empty original vault - zero sample receipts!
export const initialReceipts: Receipt[] = [];

export const mockDuplicateAlert: DuplicateAlert | null = null;

export const mockMonthlyBudget: Budget = {
  id: 'bgt_current',
  month: new Date().toISOString().slice(0, 7),
  totalBudget: 80000,
  categories: [
    {
      category: 'Electronics',
      allocatedAmount: 35000,
      spentAmount: 0,
      color: '#3b82f6',
    },
    {
      category: 'Food & Dining',
      allocatedAmount: 15000,
      spentAmount: 0,
      color: '#f97316',
    },
    {
      category: 'Groceries',
      allocatedAmount: 12000,
      spentAmount: 0,
      color: '#10b981',
    },
    {
      category: 'Travel & Commute',
      allocatedAmount: 8000,
      spentAmount: 0,
      color: '#8b5cf6',
    },
    {
      category: 'Utilities & Telecom',
      allocatedAmount: 6000,
      spentAmount: 0,
      color: '#06b6d4',
    },
    {
      category: 'Shopping & Apparel',
      allocatedAmount: 10000,
      spentAmount: 0,
      color: '#ec4899',
    },
  ],
};

export const mockSpendingTrends: SpendingTrendPoint[] = [];
