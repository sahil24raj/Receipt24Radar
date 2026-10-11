import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { UploadOCRPage } from './components/upload/UploadOCRPage';
import { ReceiptVaultPage } from './components/vault/ReceiptVaultPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { WarrantyTrackerPage } from './components/warranty/WarrantyTrackerPage';
import { BudgetManagerPage } from './components/budget/BudgetManagerPage';
import { ArchitectureModal } from './components/architecture/ArchitectureModal';
import { ReceiptDetailModal } from './components/vault/ReceiptDetailModal';
import { ManualExpenseModal } from './components/upload/ManualExpenseModal';
import { SetBudgetModal } from './components/budget/SetBudgetModal';
import { ToastContainer } from './components/ui/ToastContainer';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, activePage } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'upload':
        return <UploadOCRPage />;
      case 'vault':
        return <ReceiptVaultPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'warranties':
        return <WarrantyTrackerPage />;
      case 'budgets':
        return <BudgetManagerPage />;
      case 'architecture':
        return <ArchitectureModal />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar on Desktop */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-16 md:mb-0">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <ReceiptDetailModal />
      <ManualExpenseModal />
      <SetBudgetModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
