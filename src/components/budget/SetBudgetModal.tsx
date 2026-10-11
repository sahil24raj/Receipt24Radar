import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';
import { formatINR } from '../../lib/utils';
import {
  X,
  WalletCards,
  CheckCircle2,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Electronics',
  'Food & Dining',
  'Groceries',
  'Travel & Commute',
  'Utilities & Telecom',
  'Healthcare & Wellness',
  'Entertainment',
  'Office & Business',
  'Shopping & Apparel',
];

const PRESET_AMOUNTS = [
  { label: '₹25K', value: 25000, desc: 'Starter' },
  { label: '₹50K', value: 50000, desc: 'Moderate' },
  { label: '₹75K', value: 75000, desc: 'Pro' },
  { label: '₹1.0L', value: 100000, desc: 'Executive' },
  { label: '₹1.5L', value: 150000, desc: 'Business' },
  { label: '₹2.0L', value: 200000, desc: 'Enterprise' },
];

export const SetBudgetModal: React.FC = () => {
  const {
    budget,
    setTotalMonthlyBudget,
    updateBudgetCategory,
    addBudgetCategory,
    deleteBudgetCategory,
    isBudgetModalOpen,
    setIsBudgetModalOpen,
  } = useApp();

  const [totalAmount, setTotalAmount] = useState<number>(budget.totalBudget || 50000);
  const [targetMonth, setTargetMonth] = useState<string>(
    budget.month || new Date().toISOString().slice(0, 7)
  );
  const [categoryAllocations, setCategoryAllocations] = useState<
    { category: ExpenseCategory; allocatedAmount: number; color: string }[]
  >([]);
  const [selectedNewCategory, setSelectedNewCategory] = useState<ExpenseCategory | ''>('');
  const [newCategoryAmount, setNewCategoryAmount] = useState<number>(5000);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isBudgetModalOpen) {
      setTotalAmount(budget.totalBudget || 50000);
      setTargetMonth(budget.month || new Date().toISOString().slice(0, 7));
      setCategoryAllocations(
        budget.categories.map((c) => ({
          category: c.category,
          allocatedAmount: c.allocatedAmount,
          color: c.color,
        }))
      );
      setIsAddingCategory(false);
    }
  }, [isBudgetModalOpen, budget]);

  if (!isBudgetModalOpen) return null;

  const sumOfCategories = categoryAllocations.reduce((sum, c) => sum + c.allocatedAmount, 0);
  const difference = totalAmount - sumOfCategories;

  const handlePresetClick = (amount: number) => {
    setTotalAmount(amount);
  };

  const handleCategoryAmountChange = (category: ExpenseCategory, amount: number) => {
    setCategoryAllocations((prev) =>
      prev.map((c) => (c.category === category ? { ...c, allocatedAmount: Math.max(0, amount) } : c))
    );
  };

  const handleDeleteCategoryAllocation = (category: ExpenseCategory) => {
    setCategoryAllocations((prev) => prev.filter((c) => c.category !== category));
  };

  const handleAutoDistribute = () => {
    if (categoryAllocations.length === 0) return;
    const count = categoryAllocations.length;
    const equalShare = Math.round(totalAmount / count / 100) * 100; // round to nearest 100
    setCategoryAllocations((prev) =>
      prev.map((c) => ({
        ...c,
        allocatedAmount: equalShare,
      }))
    );
  };

  const handleAddNewCategory = () => {
    if (!selectedNewCategory) return;
    const defaultColors = [
      '#0284c7',
      '#0d9488',
      '#f97316',
      '#8b5cf6',
      '#ec4899',
      '#eab308',
      '#10b981',
      '#6366f1',
    ];
    const color = defaultColors[categoryAllocations.length % defaultColors.length];
    setCategoryAllocations((prev) => [
      ...prev,
      {
        category: selectedNewCategory,
        allocatedAmount: Math.max(0, newCategoryAmount),
        color,
      },
    ]);
    setSelectedNewCategory('');
    setNewCategoryAmount(5000);
    setIsAddingCategory(false);
  };

  const handleSave = () => {
    // 1. Save master total budget & month
    setTotalMonthlyBudget(totalAmount, targetMonth);

    // 2. Synchronize all categories
    // Update existing or add new
    categoryAllocations.forEach((cat) => {
      const exists = budget.categories.some((c) => c.category === cat.category);
      if (exists) {
        updateBudgetCategory(cat.category, cat.allocatedAmount);
      } else {
        addBudgetCategory(cat.category, cat.allocatedAmount, cat.color);
      }
    });

    // Remove deleted categories
    budget.categories.forEach((cat) => {
      const stillPresent = categoryAllocations.some((c) => c.category === cat.category);
      if (!stillPresent) {
        deleteBudgetCategory(cat.category);
      }
    });

    setIsBudgetModalOpen(false);
  };

  const availableCategoriesToAdd = ALL_EXPENSE_CATEGORIES.filter(
    (cat) => !categoryAllocations.some((c) => c.category === cat)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/20">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Set Monthly Budget
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-semibold">
                  Live SaaS Tracker
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure your monthly spending ceiling & category allocation targets.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBudgetModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Target Billing Month */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Target Billing Month
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                All receipts within this billing month will be tracked against this budget.
              </span>
            </div>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 2. Total Monthly Budget Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Total Monthly Budget Limit
              </label>
              <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                {formatINR(totalAmount)}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-xl">
                ₹
              </div>
              <input
                type="number"
                min="0"
                step="500"
                value={totalAmount === 0 ? '' : totalAmount}
                onChange={(e) => setTotalAmount(Math.max(0, Number(e.target.value)))}
                placeholder="Enter monthly budget (e.g. 50000)"
                className="w-full pl-10 pr-4 py-3.5 text-xl font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-sky-500 dark:focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
              />
            </div>

            {/* Quick Preset Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    totalAmount === preset.value
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/30 ring-2 ring-sky-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                  <span className="text-[10px] opacity-75 ml-1">({preset.desc})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category Allocation Meters */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Category Spending Allocations ({categoryAllocations.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  Allocate limits per expense category for granular tracking.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoDistribute}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 rounded-lg transition-colors"
                  title="Distribute total budget equally across categories"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Auto Distribute</span>
                </button>

                {availableCategoriesToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Add Category Form */}
            {isAddingCategory && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Add New Category Limit
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedNewCategory}
                    onChange={(e) => setSelectedNewCategory(e.target.value as ExpenseCategory)}
                    className="flex-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select category to add...</option>
                    {availableCategoriesToAdd.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <div className="relative w-full sm:w-36">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={newCategoryAmount}
                      onChange={(e) => setNewCategoryAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="Limit"
                      className="w-full pl-6 pr-2 py-2 text-xs font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    disabled={!selectedNewCategory}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Category Allocations List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categoryAllocations.map((cat) => {
                const percentOfTotal =
                  totalAmount > 0
                    ? Math.round((cat.allocatedAmount / totalAmount) * 100)
                    : 0;

                return (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-[140px] sm:min-w-[180px]">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {percentOfTotal}% of total budget
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="relative w-32 sm:w-40">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={cat.allocatedAmount === 0 ? '' : cat.allocatedAmount}
                          onChange={(e) =>
                            handleCategoryAmountChange(
                              cat.category,
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryAllocation(cat.category)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove category limit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Budget Rebalancing Summary Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Master Total Budget:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {formatINR(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Sum of Category Limits:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                {formatINR(sumOfCategories)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {difference >= 0 ? 'Unallocated Buffer:' : 'Over-allocated by:'}
              </span>
              <span
                className={`font-mono font-bold ${
                  difference >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatINR(Math.abs(difference))}
              </span>
            </div>

            {difference < 0 && (
              <div className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Category limits exceed your master total budget. You can click &quot;Auto Distribute&quot; or keep custom individual buffers.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/20 active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Monthly Budget</span>
          </button>
        </div>
      </div>
    </div>
  );
};
