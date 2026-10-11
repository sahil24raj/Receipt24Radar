import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/utils';
import {
  WalletCards,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const BudgetManagerPage: React.FC = () => {
  const {
    budget,
    updateBudgetCategory,
    deleteBudgetCategory,
    setTotalMonthlyBudget,
    receipts,
    setIsBudgetModalOpen,
  } = useApp();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<number>(0);
  const [isEditingTotal, setIsEditingTotal] = useState<boolean>(false);
  const [tempTotal, setTempTotal] = useState<number>(budget.totalBudget || 50000);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    budget.month || new Date().toISOString().slice(0, 7)
  );

  // Recalculate spent per category from live receipts for selected month
  const categorySpentMap: { [key: string]: number } = {};
  const monthReceipts = receipts.filter((r) =>
    selectedMonth ? r.purchaseDate.startsWith(selectedMonth) : true
  );

  monthReceipts.forEach((r) => {
    categorySpentMap[r.category] = (categorySpentMap[r.category] || 0) + r.totalAmount;
  });

  const totalSpent = Object.values(categorySpentMap).reduce((a, b) => a + b, 0);
  const remainingTotal = Math.max(0, budget.totalBudget - totalSpent);
  const totalPercent =
    budget.totalBudget > 0
      ? Math.min(100, Math.round((totalSpent / budget.totalBudget) * 100))
      : 0;

  // Format month title nicely (e.g., October 2026)
  const formattedMonthTitle = (() => {
    try {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMonth;
    }
  })();

  const handleStartEditCategory = (category: string, current: number) => {
    setEditingCategory(category);
    setTempAmount(current);
  };

  const handleSaveEditCategory = (category: string) => {
    updateBudgetCategory(category, tempAmount);
    setEditingCategory(null);
  };

  const handleSaveTotalBudget = () => {
    setTotalMonthlyBudget(tempTotal, selectedMonth);
    setIsEditingTotal(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Monthly Budget & Expense Limits</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-semibold hidden sm:inline-block">
              Radar Control
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set spending boundaries, configure category caps, and track live utilization against receipts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 shadow-xs active:scale-[0.98] transition-all"
          >
            <WalletCards className="w-4 h-4" />
            <span>Set Monthly Budget</span>
          </button>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shrink-0">
              <WalletCards className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Monthly Budget ({formattedMonthTitle})
                </span>
                {!isEditingTotal && (
                  <button
                    onClick={() => {
                      setTempTotal(budget.totalBudget);
                      setIsEditingTotal(true);
                    }}
                    className="text-slate-400 hover:text-sky-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Quick Edit Total Budget"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingTotal ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold font-mono text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={tempTotal}
                    onChange={(e) => setTempTotal(Math.max(0, Number(e.target.value)))}
                    className="px-3 py-1.5 text-xl font-extrabold font-mono rounded-xl border border-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-44 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleSaveTotalBudget}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setIsEditingTotal(false)}
                    className="px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-0.5">
                  {formatINR(budget.totalBudget)}
                </h2>
              )}
            </div>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Spent So Far</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono block">
                {formatINR(totalSpent)}
              </span>
              <span className="text-[10px] text-slate-400">
                {monthReceipts.length} receipt{monthReceipts.length !== 1 ? 's' : ''} this month
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                Runway Remaining
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                {formatINR(remainingTotal)}
              </span>
              <span className="text-[10px] text-emerald-500">
                {budget.totalBudget > totalSpent ? 'Within safety limit' : 'Budget exceeded'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block">Utilization</span>
              <span
                className={`text-lg font-bold font-mono block ${
                  totalPercent > 90
                    ? 'text-rose-600'
                    : totalPercent > 75
                    ? 'text-amber-500'
                    : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {totalPercent}%
              </span>
              <span className="text-[10px] text-slate-400">
                {100 - totalPercent}% buffer left
              </span>
            </div>
          </div>
        </div>

        {/* Master Progress bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Overall Spending Meter: {totalPercent}%</span>
            <span>
              {remainingTotal > 0
                ? `${formatINR(remainingTotal)} headroom available`
                : 'Budget Exceeded!'}
            </span>
          </div>
          <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPercent > 90
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : totalPercent > 75
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${totalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Allocation Meters Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Spending Ceilings ({budget.categories.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Individual category limits actively monitored on every receipt scan.
            </p>
          </div>

          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adjust / Add Categories</span>
          </button>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budget.categories.map((c) => {
            const spent = categorySpentMap[c.category] || 0;
            const percent =
              c.allocatedAmount > 0
                ? Math.min(100, Math.round((spent / c.allocatedAmount) * 100))
                : 0;
            const isOverBudget = spent > c.allocatedAmount;
            const isEditing = editingCategory === c.category;

            return (
              <div
                key={c.category}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.category}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => handleStartEditCategory(c.category, c.allocatedAmount)}
                        className="text-xs text-slate-400 hover:text-sky-600 flex items-center gap-1 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit allocation limit"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSaveEditCategory(c.category)}
                        className="text-xs text-emerald-600 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    )}

                    <button
                      onClick={() => deleteBudgetCategory(c.category)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Remove category limit"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Amount display or edit input */}
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={tempAmount}
                      onChange={(e) => setTempAmount(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 text-sm font-mono font-bold rounded-lg border border-sky-400 dark:border-sky-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatINR(spent)}{' '}
                      <span className="font-normal text-slate-400 text-xs">spent</span>
                    </span>
                    <span className="text-slate-500 font-semibold">
                      Limit: {formatINR(c.allocatedAmount)}
                    </span>
                  </div>
                )}

                {/* Meter Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-rose-500' : ''
                    }`}
                    style={{
                      backgroundColor: isOverBudget ? undefined : c.color,
                      width: `${percent}%`,
                    }}
                  />
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  {isOverBudget ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Over budget by {formatINR(spent - c.allocatedAmount)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {100 - percent}% headroom remaining
                    </span>
                  )}
                  <span className="text-slate-400 font-mono font-medium">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {budget.categories.length === 0 && (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <WalletCards className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
              No Category Ceilings Configured
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Define category limits to receive alerts when your dining, grocery, or shopping expenses rise.
            </p>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors"
            >
              Configure Budget Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
