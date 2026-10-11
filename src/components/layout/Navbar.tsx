import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Sun,
  Moon,
  Upload,
  PlusCircle,
  Database,
  Bell,
  Search,
  LogOut,
} from 'lucide-react';

import { BrandLogo } from '../common/BrandLogo';

export const Navbar: React.FC<{ onOpenMobileMenu?: () => void }> = () => {
  const {
    user,
    logout,
    theme,
    toggleTheme,
    setActivePage,
    setIsManualModalOpen,
    duplicateAlert,
    receipts,
    isSupabaseConnected,
    setIsSupabaseModalOpen,
  } = useApp();

  // Count expiring warranties within 30 days
  const expiringWarrantiesCount = receipts.filter(
    (r) => r.hasWarranty && r.warrantyStatus === 'EXPIRING_SOON'
  ).length;

  const pendingAlertsCount = (duplicateAlert ? 1 : 0) + expiringWarrantiesCount;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Brand title on mobile / search on desktop */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <BrandLogo size="md" showTagline={true} />
        </div>
      </div>

      {/* Middle search shortcut */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
        <div
          onClick={() => setActivePage('vault')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm cursor-pointer border border-slate-200/60 dark:border-slate-700/60 transition-all"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search receipts by merchant, invoice #, amount...</span>
          <kbd className="ml-auto text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-mono">
            /
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Supabase Cloud Connection Status button */}
        <button
          onClick={() => setIsSupabaseModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isSupabaseConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
          }`}
          title="Supabase PostgreSQL & Auth Configuration"
        >
          <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="hidden sm:inline">Supabase</span>
          <span className="text-[10px] opacity-80">{isSupabaseConnected ? 'Live' : 'Config'}</span>
        </button>

        {/* PostgreSQL Schema viewer button */}
        <button
          onClick={() => setActivePage('architecture')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Inspect PostgreSQL Relational Architecture"
        >
          <Database className="w-3.5 h-3.5 text-cyan-500" />
          <span>DB Schema</span>
        </button>

        {/* Quick Add manual expense */}
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          <span>Quick Manual</span>
        </button>

        {/* Upload Receipt CTA */}
        <button
          onClick={() => setActivePage('upload')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/25 active:scale-95 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Receipt</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            if (duplicateAlert) setActivePage('dashboard');
            else setActivePage('warranties');
          }}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={pendingAlertsCount > 0 ? `${pendingAlertsCount} alerts require attention` : 'No active alerts'}
        >
          <Bell className="w-5 h-5" />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-amber-500 rounded-full animate-pulse">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* User Avatar & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div
              onClick={() => setActivePage('dashboard')}
              className="flex items-center gap-2 cursor-pointer"
              title={`Logged in as ${user.email || user.name}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-500/40 shadow-sm ring-2 ring-sky-500/10">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden xl:inline text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {user.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
