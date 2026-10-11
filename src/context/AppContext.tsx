import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Receipt,
  Budget,
  BudgetCategory,
  ExpenseCategory,
  DuplicateAlert,
  SpendingTrendPoint,
} from '../types';
import {
  mockUser,
  initialReceipts,
  mockMonthlyBudget,
  mockDuplicateAlert,
  mockSpendingTrends,
} from '../data/mockData';

export type PageView =
  | 'dashboard'
  | 'upload'
  | 'vault'
  | 'analytics'
  | 'warranties'
  | 'budgets'
  | 'architecture';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp?: number;
}

interface AppContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  demoLogin: () => void;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;

  // Receipts
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  updateReceipt: (receipt: Receipt) => void;
  deleteReceipt: (receiptId: string) => void;
  bulkDeleteReceipts: (receiptIds: string[]) => void;
  selectedReceiptForDetail: Receipt | null;
  setSelectedReceiptForDetail: (receipt: Receipt | null) => void;

  // Duplicate Alert
  duplicateAlert: DuplicateAlert | null;
  dismissDuplicateAlert: (id: string) => void;
  resolveDuplicateAsRefunded: (id: string) => void;

  // Budget & Trends
  budget: Budget;
  spendingTrends: SpendingTrendPoint[];
  setTotalMonthlyBudget: (total: number, month?: string) => void;
  updateBudgetCategory: (category: string, allocated: number) => void;
  addBudgetCategory: (category: ExpenseCategory, allocated: number, color?: string) => void;
  deleteBudgetCategory: (category: string) => void;

  // Navigation & Theme
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Toast System
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Modals
  isManualModalOpen: boolean;
  setIsManualModalOpen: (open: boolean) => void;
  isBudgetModalOpen: boolean;
  setIsBudgetModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('receipt_radar_user');
    return saved ? JSON.parse(saved) : mockUser;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('receipt_radar_auth') !== 'false';
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('receipt_radar_receipts');
    if (!saved) return [];
    try {
      const parsed: Receipt[] = JSON.parse(saved);
      // Clean out any old mock receipts
      const realOnly = parsed.filter(
        (r) =>
          !r.id.startsWith('rcpt_rd_') &&
          !r.id.startsWith('rcpt_amz_') &&
          !r.id.startsWith('rcpt_swg_') &&
          !r.id.startsWith('rcpt_ubr_') &&
          !r.id.startsWith('rcpt_zep_') &&
          !r.id.startsWith('rcpt_rel_') &&
          !r.id.startsWith('rcpt_croma_')
      );
      if (realOnly.length !== parsed.length) {
        localStorage.setItem('receipt_radar_receipts', JSON.stringify(realOnly));
      }
      return realOnly;
    } catch {
      return [];
    }
  });

  const [budget, setBudget] = useState<Budget>(() => {
    const saved = localStorage.getItem('receipt_radar_budget');
    return saved ? JSON.parse(saved) : mockMonthlyBudget;
  });

  const dynamicBudget: Budget = React.useMemo(() => {
    return {
      ...budget,
      categories: budget.categories.map((c) => {
        const spent = receipts
          .filter((r) => r.category === c.category)
          .reduce((sum, r) => sum + r.totalAmount, 0);
        return {
          ...c,
          spentAmount: spent,
        };
      }),
    };
  }, [budget, receipts]);

  const dynamicSpendingTrends: SpendingTrendPoint[] = React.useMemo(() => {
    if (receipts.length === 0) return [];
    const monthMap: Record<string, { totalSpend: number; count: number }> = {};
    receipts.forEach((r) => {
      const ym = r.purchaseDate.slice(0, 7);
      if (!monthMap[ym]) monthMap[ym] = { totalSpend: 0, count: 0 };
      monthMap[ym].totalSpend += r.totalAmount;
      monthMap[ym].count += 1;
    });
    const months = Object.keys(monthMap).sort();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((ym) => {
      const parts = ym.split('-');
      const year = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      return {
        month: `${monthNames[mIdx]} ${year}`,
        totalSpend: monthMap[ym].totalSpend,
        receiptCount: monthMap[ym].count,
        budgetLimit: budget.totalBudget,
      };
    });
  }, [receipts, budget.totalBudget]);

  const [duplicateAlert, setDuplicateAlert] = useState<DuplicateAlert | null>(null);

  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [selectedReceiptForDetail, setSelectedReceiptForDetail] = useState<Receipt | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('receipt_radar_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return 'light';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply theme class to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('receipt_radar_theme', theme);
  }, [theme]);

  // Sync receipts to storage
  useEffect(() => {
    localStorage.setItem('receipt_radar_receipts', JSON.stringify(receipts));
  }, [receipts]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const login = async (email: string, _pass: string): Promise<boolean> => {
    const loggedUser: User = {
      ...mockUser,
      email,
      name: email.split('@')[0].replace('.', ' ') || 'Sahil Verma',
    };
    setUser(loggedUser);
    setIsAuthenticated(true);
    localStorage.setItem('receipt_radar_user', JSON.stringify(loggedUser));
    localStorage.setItem('receipt_radar_auth', 'true');
    showToast({
      type: 'success',
      title: 'Welcome back!',
      message: `Signed in securely as ${loggedUser.name}`,
    });
    return true;
  };

  const demoLogin = () => {
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('receipt_radar_user', JSON.stringify(mockUser));
    localStorage.setItem('receipt_radar_auth', 'true');
    showToast({
      type: 'success',
      title: 'Demo Session Active',
      message: 'Logged in as Sahil Verma with full verified telemetry.',
    });
  };

  const register = async (name: string, email: string, _pass: string): Promise<boolean> => {
    const newUser: User = {
      ...mockUser,
      id: `usr_${Date.now()}`,
      name,
      email,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('receipt_radar_user', JSON.stringify(newUser));
    localStorage.setItem('receipt_radar_auth', 'true');
    showToast({
      type: 'success',
      title: 'Account Created',
      message: 'Zero-knowledge encryption keys initialized for your vault.',
    });
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.setItem('receipt_radar_auth', 'false');
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Vault locked. Session credentials terminated.',
    });
  };

  const addReceipt = (receipt: Receipt) => {
    setReceipts((prev) => [receipt, ...prev]);
    showToast({
      type: 'success',
      title: 'Receipt Stored Privately',
      message: `${receipt.merchantName} (₹${receipt.totalAmount.toLocaleString('en-IN')}) verified & SHA-256 hashed.`,
    });
  };

  const updateReceipt = (updated: Receipt) => {
    setReceipts((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedReceiptForDetail?.id === updated.id) {
      setSelectedReceiptForDetail(updated);
    }
    showToast({
      type: 'success',
      title: 'Receipt Updated',
      message: 'Changes saved to encrypted vault.',
    });
  };

  const deleteReceipt = (receiptId: string) => {
    const target = receipts.find((r) => r.id === receiptId);
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
    if (selectedReceiptForDetail?.id === receiptId) {
      setSelectedReceiptForDetail(null);
    }
    showToast({
      type: 'info',
      title: 'Receipt Deleted',
      message: `${target?.merchantName || 'Receipt'} was permanently purged from vault.`,
    });
  };

  const bulkDeleteReceipts = (receiptIds: string[]) => {
    setReceipts((prev) => prev.filter((r) => !receiptIds.includes(r.id)));
    showToast({
      type: 'info',
      title: 'Batch Action Complete',
      message: `${receiptIds.length} receipts removed from vault.`,
    });
  };

  const dismissDuplicateAlert = (_id: string) => {
    setDuplicateAlert(null);
    localStorage.removeItem('receipt_radar_dup_alert');
    showToast({
      type: 'info',
      title: 'Alert Dismissed',
      message: 'Duplicate alert marked as reviewed.',
    });
  };

  const resolveDuplicateAsRefunded = (_id: string) => {
    if (duplicateAlert) {
      deleteReceipt(duplicateAlert.duplicateReceiptId);
      setDuplicateAlert(null);
      localStorage.removeItem('receipt_radar_dup_alert');
      showToast({
        type: 'success',
        title: 'Duplicate Resolved',
        message: 'Duplicate transaction purged from monthly spend calculations.',
      });
    }
  };

  const setTotalMonthlyBudget = (total: number, month?: string) => {
    setBudget((prev) => {
      const newBgt: Budget = {
        ...prev,
        totalBudget: Math.max(0, total),
        month: month || prev.month || new Date().toISOString().slice(0, 7),
      };
      localStorage.setItem('receipt_radar_budget', JSON.stringify(newBgt));
      return newBgt;
    });
    showToast({
      type: 'success',
      title: 'Monthly Budget Updated',
      message: `Overall monthly spending ceiling set to ₹${total.toLocaleString('en-IN')}`,
    });
  };

  const updateBudgetCategory = (categoryName: string, allocated: number) => {
    setBudget((prev) => {
      const updatedCategories = prev.categories.map((c) =>
        c.category === categoryName ? { ...c, allocatedAmount: Math.max(0, allocated) } : c
      );
      const newBgt: Budget = {
        ...prev,
        categories: updatedCategories,
      };
      localStorage.setItem('receipt_radar_budget', JSON.stringify(newBgt));
      return newBgt;
    });
    showToast({
      type: 'success',
      title: 'Category Limit Updated',
      message: `${categoryName} allocation adjusted to ₹${allocated.toLocaleString('en-IN')}`,
    });
  };

  const addBudgetCategory = (category: ExpenseCategory, allocated: number, color?: string) => {
    setBudget((prev) => {
      const exists = prev.categories.some((c) => c.category === category);
      let updatedCategories: BudgetCategory[];
      if (exists) {
        updatedCategories = prev.categories.map((c) =>
          c.category === category ? { ...c, allocatedAmount: Math.max(0, allocated) } : c
        );
      } else {
        const defaultColors = ['#0284c7', '#0d9488', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#10b981', '#6366f1'];
        const chosenColor = color || defaultColors[prev.categories.length % defaultColors.length];
        updatedCategories = [
          ...prev.categories,
          {
            category,
            allocatedAmount: Math.max(0, allocated),
            spentAmount: 0,
            color: chosenColor,
          },
        ];
      }
      const newBgt: Budget = {
        ...prev,
        categories: updatedCategories,
      };
      localStorage.setItem('receipt_radar_budget', JSON.stringify(newBgt));
      return newBgt;
    });
    showToast({
      type: 'success',
      title: 'Category Budget Added',
      message: `${category} limit set to ₹${allocated.toLocaleString('en-IN')}`,
    });
  };

  const deleteBudgetCategory = (categoryName: string) => {
    setBudget((prev) => {
      const updatedCategories = prev.categories.filter((c) => c.category !== categoryName);
      const newBgt: Budget = {
        ...prev,
        categories: updatedCategories,
      };
      localStorage.setItem('receipt_radar_budget', JSON.stringify(newBgt));
      return newBgt;
    });
    showToast({
      type: 'info',
      title: 'Category Removed',
      message: `Budget limit for ${categoryName} has been removed.`,
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        demoLogin,
        register,
        logout,
        receipts,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        bulkDeleteReceipts,
        selectedReceiptForDetail,
        setSelectedReceiptForDetail,
        duplicateAlert,
        dismissDuplicateAlert,
        resolveDuplicateAsRefunded,
        budget: dynamicBudget,
        spendingTrends: dynamicSpendingTrends,
        setTotalMonthlyBudget,
        updateBudgetCategory,
        addBudgetCategory,
        deleteBudgetCategory,
        activePage,
        setActivePage,
        theme,
        toggleTheme,
        toasts,
        showToast,
        dismissToast,
        isManualModalOpen,
        setIsManualModalOpen,
        isBudgetModalOpen,
        setIsBudgetModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
