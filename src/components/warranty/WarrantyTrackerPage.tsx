import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatDate,
  calculateDaysRemaining,
} from '../../lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Search,
} from 'lucide-react';

export const WarrantyTrackerPage: React.FC = () => {
  const { receipts, setSelectedReceiptForDetail } = useApp();
  const [tab, setTab] = useState<'all' | 'warranties' | 'returns'>('all');
  const [search, setSearch] = useState('');

  // Warranties
  const warrantyReceipts = receipts.filter((r) => r.hasWarranty);
  const activeWarranties = warrantyReceipts.filter((r) => r.warrantyStatus === 'ACTIVE');
  const expiringWarranties = warrantyReceipts.filter((r) => r.warrantyStatus === 'EXPIRING_SOON');

  // Returns
  const returnReceipts = receipts.filter((r) => r.hasReturnWindow);
  const eligibleReturns = returnReceipts.filter((r) => r.returnStatus === 'ELIGIBLE' || r.returnStatus === 'EXPIRING_SOON');
  const expiringReturns = returnReceipts.filter((r) => r.returnStatus === 'EXPIRING_SOON');

  const filteredItems = receipts.filter((r) => {
    if (tab === 'warranties' && !r.hasWarranty) return false;
    if (tab === 'returns' && !r.hasReturnWindow) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.merchantName.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.items.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return r.hasWarranty || r.hasReturnWindow;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Warranty & Return Radar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Never miss an appliance warranty claim or online return deadline again.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Warranties</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {activeWarranties.length}{' '}
            <span className="text-sm font-semibold text-slate-400">devices</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1 font-semibold">Protected under manufacturer warranty</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Warranty Expiring (30d)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {expiringWarranties.length}{' '}
            <span className="text-sm font-semibold text-slate-400">appliances</span>
          </div>
          <p className="text-xs text-amber-600 mt-1 font-semibold">Schedule maintenance before expiry</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Return Windows</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {eligibleReturns.length}{' '}
            <span className="text-sm font-semibold text-slate-400">orders</span>
          </div>
          <p className="text-xs text-rose-600 mt-1 font-semibold">
            {expiringReturns.length} closing within 3 days!
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setTab('warranties')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'warranties'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Warranties Only
          </button>
          <button
            onClick={() => setTab('returns')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'returns'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Return Windows Only
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or merchants..."
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Grid of tracked items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((rcpt) => {
          const wDays = calculateDaysRemaining(rcpt.warrantyExpiryDate);
          const rDays = calculateDaysRemaining(rcpt.returnDeadline);

          return (
            <div
              key={rcpt.id}
              onClick={() => setSelectedReceiptForDetail(rcpt)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-sky-600 transition-colors">
                    {rcpt.items[0]?.name || rcpt.merchantName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {rcpt.merchantName} • {formatDate(rcpt.purchaseDate)}
                  </p>
                </div>
                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {formatINR(rcpt.totalAmount)}
                </span>
              </div>

              {/* Warranty block */}
              {rcpt.hasWarranty && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    rcpt.warrantyStatus === 'ACTIVE'
                      ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : rcpt.warrantyStatus === 'EXPIRING_SOON'
                      ? 'bg-amber-50/60 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Manufacturer Warranty
                    </span>
                    <span>
                      {wDays > 0 ? `${wDays} days left` : 'Expired'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Expiry: {formatDate(rcpt.warrantyExpiryDate)} ({rcpt.warrantyDurationMonths || 12} Months)
                  </p>
                </div>
              )}

              {/* Return block */}
              {rcpt.hasReturnWindow && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    rcpt.returnStatus === 'EXPIRING_SOON'
                      ? 'bg-rose-50/60 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800 text-rose-800 dark:text-rose-300 animate-pulse'
                      : 'bg-sky-50/60 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900 text-sky-800 dark:text-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Return / Exchange Window
                    </span>
                    <span>
                      {rDays > 0 ? `${rDays} days left` : 'Closed'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Deadline: {formatDate(rcpt.returnDeadline)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                <span>Invoice: {rcpt.invoiceNumber}</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline flex items-center gap-1">
                  View Proof <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
