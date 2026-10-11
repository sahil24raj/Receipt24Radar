import React from 'react';
import { useApp, PageView } from '../../context/AppContext';
import {
  LayoutDashboard,
  FolderArchive,
  ScanLine,
  PieChart,
  ShieldAlert,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activePage, setActivePage, receipts, duplicateAlert } = useApp();

  const expiringWarrantiesCount = receipts.filter(
    (r) => r.hasWarranty && r.warrantyStatus === 'EXPIRING_SOON'
  ).length;

  const items: { id: PageView; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: duplicateAlert ? 1 : undefined,
    },
    {
      id: 'vault',
      label: 'Vault',
      icon: <FolderArchive className="w-5 h-5" />,
    },
    {
      id: 'upload',
      label: 'Scan OCR',
      icon: <ScanLine className="w-6 h-6" />,
    },
    {
      id: 'warranties',
      label: 'Warranty',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: expiringWarrantiesCount > 0 ? expiringWarrantiesCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Insights',
      icon: <PieChart className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activePage === item.id;
          const isUpload = item.id === 'upload';

          if (isUpload) {
            return (
              <button
                key={item.id}
                onClick={() => setActivePage('upload')}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 via-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 group-active:scale-95 transition-transform">
                  <ScanLine className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white bg-amber-500">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
