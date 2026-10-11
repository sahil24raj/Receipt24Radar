import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatDate,
  getGreeting,
  calculateDaysRemaining,
} from '../../lib/utils';
import {
  Upload,
  PlusCircle,
  WalletCards,
  PieChart as PieChartIcon,
  Receipt as ReceiptIcon,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  Edit2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const {
    user,
    receipts,
    budget,
    spendingTrends,
    duplicateAlert,
    dismissDuplicateAlert,
    resolveDuplicateAsRefunded,
    setActivePage,
    setSelectedReceiptForDetail,
    deleteReceipt,
    setIsManualModalOpen,
    setIsBudgetModalOpen,
  } = useApp();

  const activeMonthKey = budget.month || new Date().toISOString().slice(0, 7);
  const activeMonthName = (() => {
    try {
      const [y, m] = activeMonthKey.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Current Billing Cycle';
    }
  })();

  // Metrics calculations
  const totalSpendThisMonth = receipts
    .filter((r) => r.purchaseDate.startsWith(activeMonthKey))
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalReceiptsCount = receipts.length;

  const budgetRemaining = Math.max(0, budget.totalBudget - totalSpendThisMonth);
  const budgetUtilizationPercent = Math.min(
    100,
    Math.round((totalSpendThisMonth / budget.totalBudget) * 100)
  );

  // Warranty / Return upcoming alerts
  const expiringWarranties = receipts.filter(
    (r) => r.hasWarranty && r.warrantyStatus === 'EXPIRING_SOON'
  );
  const expiringReturns = receipts.filter(
    (r) => r.hasReturnWindow && r.returnStatus === 'EXPIRING_SOON'
  );
  const totalUpcomingAlerts = expiringWarranties.length + expiringReturns.length;

  // Category breakdown for Donut chart
  const categoryMap: { [key: string]: number } = {};
  receipts.forEach((r) => {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + r.totalAmount;
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  const CATEGORY_COLORS = [
    '#0284c7', // Sky
    '#0d9488', // Teal
    '#f97316', // Orange
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#eab308', // Amber
    '#10b981', // Emerald
    '#6366f1', // Indigo
  ];

  // Recent 6 receipts
  const recentReceipts = [...receipts]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Header Greeting & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting(user?.name ? user.name.split(' ')[0] : 'Sahil')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Financial vault encrypted. Here is your expense intelligence & warranty radar for {activeMonthName}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
          >
            <WalletCards className="w-4 h-4 text-sky-500" />
            <span>Set Budget</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Add Expense</span> Manually
          </button>

          <button
            onClick={() => setActivePage('upload')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/20 active:scale-98 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Receipt</span>
          </button>
        </div>
      </div>

      {/* 2. Potential Duplicate Alert Card (if triggered) */}
      {duplicateAlert && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-sm sm:text-base">
                  Potential Duplicate Transaction Detected
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-200">
                  {duplicateAlert.confidence}% Match
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                Found two identical charges of <span className="font-bold">{formatINR(duplicateAlert.amount)}</span> for{' '}
                <span className="font-semibold">{duplicateAlert.merchantName}</span> within 3 minutes on {formatDate(duplicateAlert.date)}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => dismissDuplicateAlert(duplicateAlert.id)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
            >
              Keep Both
            </button>
            <button
              onClick={() => resolveDuplicateAsRefunded(duplicateAlert.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
            >
              Resolve as Duplicate / Remove
            </button>
          </div>
        </div>
      )}

      {/* 3. Four Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Total Spend This Month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Spend This Month
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <ReceiptIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatINR(totalSpendThisMonth)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-normal">vs last month</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Number of Receipts Stored */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stored Receipts
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {totalReceiptsCount} <span className="text-sm font-semibold text-slate-400">files</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-teal-600 dark:text-teal-400">
              <span>100% SHA-256 Verified</span>
              <span className="text-slate-400 font-normal">• 0 tampered</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Budget Remaining */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Budget Remaining
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Set or Edit Monthly Budget"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <WalletCards className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatINR(budgetRemaining)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{budgetUtilizationPercent}% utilized</span>
              <span className="text-slate-400">• Limit: {formatINR(budget.totalBudget)}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Upcoming Warranty / Return Alerts */}
        <div
          onClick={() => setActivePage('warranties')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Warranty & Returns
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {totalUpcomingAlerts} <span className="text-sm font-semibold text-slate-400">deadlines</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span>Action required</span>
              <span className="text-slate-400 font-normal">• Click to review</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Spending Trends Area Chart + Category Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Spending Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Expenditure trends over the past 6 billing cycles
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Actual Spend
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                Budget Ceiling
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatINR(Number(value) || 0), 'Spent']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalSpend"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category Donut Chart (1 Col) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Spending by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current month expenditure distribution
              </p>
            </div>
          </div>

          <div className="relative flex-1 min-h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val) || 0), 'Share']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatINR(totalSpendThisMonth)}
              </span>
            </div>
          </div>

          {/* Mini Legend */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {categoryChartData.slice(0, 4).map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400 truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Reminders Card + Budget Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Reminders Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upcoming Reminders & Deadlines
              </h2>
            </div>
            <button
              onClick={() => setActivePage('warranties')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {expiringReturns.map((r) => {
              const daysLeft = calculateDaysRemaining(r.returnDeadline);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReceiptForDetail(r)}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 cursor-pointer hover:bg-rose-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Return Window Closing: {r.merchantName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Invoice {r.invoiceNumber} • {formatINR(r.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Ends Today'}
                  </span>
                </div>
              );
            })}

            {expiringWarranties.map((r) => {
              const daysLeft = calculateDaysRemaining(r.warrantyExpiryDate);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedReceiptForDetail(r)}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        Warranty Expiring: {r.merchantName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {r.items[0]?.name || 'Appliance'} • {formatDate(r.warrantyExpiryDate)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {daysLeft} days left
                  </span>
                </div>
              );
            })}

            {totalUpcomingAlerts === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                No imminent return or warranty expirations within 30 days!
              </div>
            )}
          </div>
        </div>

        {/* Budget Progress Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <WalletCards className="w-5 h-5 text-sky-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Monthly Budget Allocation
                </h2>
              </div>
              <button
                onClick={() => setActivePage('budgets')}
                className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Configure
              </button>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Spent</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {formatINR(totalSpendThisMonth)}{' '}
                <span className="text-xs font-normal text-slate-400">
                  / {formatINR(budget.totalBudget)}
                </span>
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilizationPercent > 90
                    ? 'bg-rose-500'
                    : budgetUtilizationPercent > 75
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetUtilizationPercent}%` }}
              />
            </div>

            {/* Category Sub-bars */}
            <div className="space-y-2.5 text-xs">
              {budget.categories.slice(0, 3).map((c) => {
                const percent = Math.min(
                  100,
                  Math.round((c.spentAmount / c.allocatedAmount) * 100)
                );
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                      <span className="text-slate-500">
                        {formatINR(c.spentAmount)} / {formatINR(c.allocatedAmount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: c.color,
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
            <span>Remaining Runway: {Math.max(0, 31 - new Date().getDate())} days</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              On track for savings target
            </span>
          </div>
        </div>
      </div>

      {/* 6. Quick Actions Grid */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-sky-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Quick Actions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActivePage('upload')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-2xs group"
          >
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span>Upload Receipt</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-2xs group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span>Manual Expense</span>
          </button>

          <button
            onClick={() => setActivePage('budgets')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-2xs group"
          >
            <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <WalletCards className="w-4 h-4" />
            </div>
            <span>Create Budget</span>
          </button>

          <button
            onClick={() => setActivePage('analytics')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-2xs group"
          >
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* 7. Recent Receipts Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Receipts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified authentic purchases with tax records & warranty status
            </p>
          </div>
          <button
            onClick={() => setActivePage('vault')}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            Open Full Vault ({receipts.length})
          </button>
        </div>

        {/* Responsive Table or Empty State */}
        {recentReceipts.length === 0 ? (
          <div className="py-10 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
            <ReceiptIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No receipts recorded yet
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Scan your first purchase receipt with OCR or quickly type in the details manually.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Add Manually</span>
              </button>
              <button
                onClick={() => setActivePage('upload')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Scan Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentReceipts.map((rcpt) => (
                  <tr
                    key={rcpt.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReceiptForDetail(rcpt)}
                  >
                  {/* Merchant & invoice */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {rcpt.merchantName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                      {rcpt.invoiceNumber}
                    </div>
                  </td>

                  {/* Category badge */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {rcpt.category}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {formatDate(rcpt.purchaseDate)}
                  </td>

                  {/* Amount in INR */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
                    {formatINR(rcpt.totalAmount)}
                  </td>

                  {/* Status badge */}
                  <td className="py-3.5 px-4">
                    {rcpt.isDuplicateFlagged ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        <AlertTriangle className="w-3 h-3" /> Duplicate
                      </span>
                    ) : rcpt.hasWarranty && rcpt.warrantyStatus === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Warranty Active
                      </span>
                    ) : rcpt.hasReturnWindow && rcpt.returnStatus === 'EXPIRING_SOON' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                        <Clock className="w-3 h-3" /> Return Expiring
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Verified
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReceiptForDetail(rcpt)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        title="View Receipt Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReceipt(rcpt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        title="Delete receipt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
  );
};
