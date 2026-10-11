import React, { useState } from 'react';
import { useApp, PageView } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import {
  LayoutDashboard,
  FolderArchive,
  ScanLine,
  PieChart,
  ShieldAlert,
  WalletCards,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
  Lock,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const Sidebar: React.FC = () => {
  const {
    activePage,
    setActivePage,
    user,
    logout,
    duplicateAlert,
    receipts,
    budget,
    setIsBudgetModalOpen,
    setIsManualModalOpen,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeMonthKey = budget.month || new Date().toISOString().slice(0, 7);
  const totalSpendThisMonth = receipts
    .filter((r) => r.purchaseDate.startsWith(activeMonthKey))
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const budgetPercent =
    budget.totalBudget > 0
      ? Math.min(100, Math.round((totalSpendThisMonth / budget.totalBudget) * 100))
      : 0;

  const expiringWarrantiesCount = receipts.filter(
    (r) => r.hasWarranty && r.warrantyStatus === 'EXPIRING_SOON'
  ).length;

  const navItems: {
    id: PageView;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
      badge: duplicateAlert ? '1 alert' : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'vault',
      label: 'Receipt Vault',
      icon: <FolderArchive className="w-5 h-5 shrink-0" />,
      badge: receipts.length,
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'upload',
      label: 'Upload & OCR',
      icon: <ScanLine className="w-5 h-5 shrink-0" />,
      badge: 'Smart',
      badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    },
    {
      id: 'analytics',
      label: 'Intelligence',
      icon: <PieChart className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'warranties',
      label: 'Warranties & Returns',
      icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
      badge: expiringWarrantiesCount > 0 ? expiringWarrantiesCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'budgets',
      label: 'Budgets & Limits',
      icon: <WalletCards className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header Collapse Control */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 overflow-hidden">
          <BrandLogo size="sm" variant={isCollapsed ? 'icon' : 'compact'} />
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'hidden' : 'ml-auto'
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {isCollapsed && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nav list */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span
                className={`transition-colors ${
                  isActive
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                }`}
              >
                {item.icon}
              </span>

              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.badgeColor || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* Quick Direct Manual Add Button */}
        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
            title="Add Receipt Manually"
          >
            <PlusCircle className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Quick Expense</span>}
          </button>

          <button
            onClick={() => setActivePage('architecture')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activePage === 'architecture'
                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
            } ${isCollapsed ? 'justify-center p-2' : ''}`}
            title="Database Architecture & Schema"
          >
            <Database className="w-4 h-4 text-slate-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Database Schema</span>}
          </button>
        </div>
      </div>

      {/* Mini Monthly Budget Tracker in Sidebar */}
      {!isCollapsed && (
        <div className="mx-3 mb-2 p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 dark:from-slate-800/60 dark:to-sky-950/20 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <WalletCards className="w-3.5 h-3.5 text-sky-500" />
              Monthly Budget
            </span>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-[10px] font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Set Limit
            </button>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
              {formatINR(totalSpendThisMonth)}
            </span>
            <span className="text-[10px] text-slate-400">
              / {formatINR(budget.totalBudget)}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetPercent > 90
                  ? 'bg-rose-500'
                  : budgetPercent > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Encryption security banner */}
      {!isCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Private Vault Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
            Zero-knowledge AES-256 client encryption + SHA-256 integrity seal.
          </p>
        </div>
      )}

      {/* User info & Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div
          className={`flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-sky-400/30">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || 'Sahil Verma'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'sahil.verma@example.com'}
              </p>
            </div>
          )}

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Log out of secure session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
