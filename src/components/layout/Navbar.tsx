import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sun,
  Moon,
  Upload,
  Plus,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  Database,
  Cloud,
  FolderArchive,
  ShieldCheck,
  Sparkles,
  Command,
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

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count expiring warranties within 30 days
  const expiringWarrantiesCount = receipts.filter(
    (r) => r.hasWarranty && r.warrantyStatus === 'EXPIRING_SOON'
  ).length;

  const pendingAlertsCount = (duplicateAlert ? 1 : 0) + expiringWarrantiesCount;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Brand Logo & Mobile Trigger */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group transition-opacity hover:opacity-90"
        >
          <BrandLogo size="md" showTagline={false} />
        </div>
      </div>

      {/* Middle Spotlight Search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6 lg:mx-10">
        <div
          onClick={() => setActivePage('vault')}
          className="w-full flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs sm:text-sm cursor-pointer border border-slate-200/80 dark:border-slate-700/60 transition-all shadow-xs"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">Search receipts, merchants, invoices...</span>
          <kbd className="ml-auto inline-flex items-center gap-0.5 text-[10px] bg-white dark:bg-slate-700/90 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-mono font-medium shadow-2xs">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Add Manual Expense */}
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
          title="Manual Expense Entry"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Manual Entry</span>
        </button>

        {/* Primary CTA: Upload Receipt */}
        <button
          onClick={() => setActivePage('upload')}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 shadow-xs active:scale-[0.98] transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Receipt</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            if (duplicateAlert) setActivePage('dashboard');
            else setActivePage('warranties');
          }}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={pendingAlertsCount > 0 ? `${pendingAlertsCount} alerts require attention` : 'Notifications'}
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Profile & Account Dropdown */}
        {user && (
          <div className="relative pl-1" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all focus:outline-none"
              title="Account Menu"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 shadow-2xs">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Floating Profile Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email || 'user@receiptradar.app'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Personal Workspace • Pro
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setActivePage('dashboard');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dashboard Overview</span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePage('vault');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Receipt Vault</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{receipts.length}</span>
                  </button>
                </div>

                {/* Developer & Architecture Tools */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Infrastructure & Data
                  </div>

                  <button
                    onClick={() => {
                      setIsSupabaseModalOpen(true);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Cloud className="w-3.5 h-3.5 text-slate-400" />
                      <span>Supabase Database</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${isSupabaseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isSupabaseConnected ? 'Connected' : 'Config'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActivePage('architecture');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span>Database Architecture & Schema</span>
                  </button>
                </div>

                {/* Logout Action */}
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
