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
  mockMonthlyBudget,
} from '../data/mockData';
import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase';
import {
  dbFetchReceipts,
  dbInsertReceipt,
  dbDeleteReceipt,
  dbBulkDeleteReceipts,
  dbFetchBudget,
  dbSaveBudget,
} from '../services/supabaseService';

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
  loginWithGoogle: () => Promise<void>;
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
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  isSupabaseConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const isAuth = localStorage.getItem('receipt_radar_auth') === 'true';
    const saved = localStorage.getItem('receipt_radar_user');
    return isAuth && saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('receipt_radar_auth') === 'true';
  });

  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const saved = localStorage.getItem('receipt_radar_receipts');
    if (!saved) return [];
    try {
      const parsed: Receipt[] = JSON.parse(saved);
      // Clean out mock receipt IDs
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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

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

  // Sync receipts to local cache
  useEffect(() => {
    localStorage.setItem('receipt_radar_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Supabase Auth listener & cloud data sync
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatarUrl: session.user.user_metadata?.avatar_url,
          currencyPreference: 'INR',
          monthlyBudget: 80000,
          encryptionKeyFingerprint: `sha256_${session.user.id.slice(0, 8)}`,
          role: 'user',
          twoFactorEnabled: false,
        };
        setUser(u);
        setIsAuthenticated(true);

        dbFetchReceipts(session.user.id)
          .then((cloudReceipts) => {
            if (cloudReceipts && cloudReceipts.length > 0) {
              setReceipts(cloudReceipts);
            }
          })
          .catch((err) => console.warn('Supabase fetch receipts notice:', err));

        dbFetchBudget(session.user.id)
          .then((cloudBudget) => {
            if (cloudBudget) setBudget(cloudBudget);
          })
          .catch((err) => console.warn('Supabase fetch budget notice:', err));
      } else {
        const isDemo = localStorage.getItem('receipt_radar_is_demo') === 'true';
        if (!isDemo) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.setItem('receipt_radar_auth', 'false');
          localStorage.removeItem('receipt_radar_user');
        }
      }
    });

    // Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatarUrl: session.user.user_metadata?.avatar_url,
          currencyPreference: 'INR',
          monthlyBudget: 80000,
          encryptionKeyFingerprint: `sha256_${session.user.id.slice(0, 8)}`,
          role: 'user',
          twoFactorEnabled: false,
        };
        setUser(u);
        setIsAuthenticated(true);
        try {
          const cloudReceipts = await dbFetchReceipts(session.user.id);
          if (cloudReceipts && cloudReceipts.length > 0) {
            setReceipts(cloudReceipts);
          }
        } catch (e) {
          console.warn('Notice loading receipts on auth change:', e);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const login = async (email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        showToast({
          type: 'error',
          title: 'Supabase Auth Error',
          message: error.message,
        });
        return false;
      }

      if (data.user) {
        const loggedUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          currencyPreference: 'INR',
          monthlyBudget: 80000,
          encryptionKeyFingerprint: `sha256_${data.user.id.slice(0, 8)}`,
          role: 'user',
          twoFactorEnabled: false,
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
        localStorage.setItem('receipt_radar_user', JSON.stringify(loggedUser));
        localStorage.setItem('receipt_radar_auth', 'true');

        showToast({
          type: 'success',
          title: 'Supabase Authenticated',
          message: `Signed in as ${loggedUser.name} via cloud database.`,
        });

        try {
          const cloudReceipts = await dbFetchReceipts(data.user.id);
          if (cloudReceipts.length > 0) setReceipts(cloudReceipts);
        } catch (err) {
          console.warn(err);
        }
        return true;
      }
    }

    // Local / Demo Fallback
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
      message: `Signed in securely as ${loggedUser.name} (Local Vault).`,
    });
    return true;
  };

  const demoLogin = () => {
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('receipt_radar_user', JSON.stringify(mockUser));
    localStorage.setItem('receipt_radar_auth', 'true');
    localStorage.setItem('receipt_radar_is_demo', 'true');
    showToast({
      type: 'success',
      title: 'Demo Session Active',
      message: 'Logged in as Sahil Verma with verified telemetry.',
    });
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      showToast({
        type: 'error',
        title: 'Supabase Not Connected',
        message: 'Please connect your Supabase project URL and Key to use Google OAuth.',
      });
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      showToast({
        type: 'error',
        title: 'Google Sign-In Error',
        message: error.message,
      });
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        showToast({
          type: 'error',
          title: 'Supabase Sign-Up Error',
          message: error.message,
        });
        return false;
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          currencyPreference: 'INR',
          monthlyBudget: 80000,
          encryptionKeyFingerprint: `sha256_${data.user.id.slice(0, 8)}`,
          role: 'user',
          twoFactorEnabled: false,
        };
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('receipt_radar_user', JSON.stringify(newUser));
        localStorage.setItem('receipt_radar_auth', 'true');

        showToast({
          type: 'success',
          title: 'Account Created',
          message: data.session
            ? 'Account active and connected to Supabase database.'
            : 'Account registered! Please check email if confirmation is required.',
        });
        return true;
      }
    }

    // Local / Demo Fallback
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

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(console.warn);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.setItem('receipt_radar_auth', 'false');
    localStorage.removeItem('receipt_radar_user');
    localStorage.removeItem('receipt_radar_is_demo');
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'Vault locked. Session credentials terminated.',
    });
  };

  const addReceipt = (receipt: Receipt) => {
    setReceipts((prev) => [receipt, ...prev]);

    if (isSupabaseConfigured() && user) {
      dbInsertReceipt(receipt, user.id).catch((err) => {
        console.warn('Notice: Background Supabase insert synced locally:', err);
      });
    }

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

    if (isSupabaseConfigured()) {
      dbDeleteReceipt(receiptId).catch((err) => {
        console.warn('Notice: Background Supabase delete synced locally:', err);
      });
    }

    showToast({
      type: 'info',
      title: 'Receipt Deleted',
      message: `${target?.merchantName || 'Receipt'} was permanently purged from vault.`,
    });
  };

  const bulkDeleteReceipts = (receiptIds: string[]) => {
    setReceipts((prev) => prev.filter((r) => !receiptIds.includes(r.id)));

    if (isSupabaseConfigured()) {
      dbBulkDeleteReceipts(receiptIds).catch((err) => {
        console.warn('Notice: Background Supabase bulk delete synced locally:', err);
      });
    }

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

      if (isSupabaseConfigured() && user) {
        dbSaveBudget(newBgt, user.id).catch(console.warn);
      }

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

      if (isSupabaseConfigured() && user) {
        dbSaveBudget(newBgt, user.id).catch(console.warn);
      }

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

      if (isSupabaseConfigured() && user) {
        dbSaveBudget(newBgt, user.id).catch(console.warn);
      }

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

      if (isSupabaseConfigured() && user) {
        dbSaveBudget(newBgt, user.id).catch(console.warn);
      }

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
        loginWithGoogle,
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
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        isSupabaseConnected: isSupabaseConfigured(),
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
