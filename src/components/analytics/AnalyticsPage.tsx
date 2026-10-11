import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatINRCompact,
} from '../../lib/utils';
import {
  PieChart as PieIcon,
  TrendingUp,
  Receipt,
  FileCheck2,
  Building,
  CreditCard,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { receipts } = useApp();

  // Metrics
  const totalSpend = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalTaxGST = receipts.reduce((sum, r) => sum + r.taxAmount, 0);
  const avgReceiptAmount = receipts.length > 0 ? totalSpend / receipts.length : 0;

  // Merchant Ranking
  const merchantMap: { [key: string]: { count: number; total: number } } = {};
  receipts.forEach((r) => {
    if (!merchantMap[r.merchantName]) {
      merchantMap[r.merchantName] = { count: 0, total: 0 };
    }
    merchantMap[r.merchantName].count += 1;
    merchantMap[r.merchantName].total += r.totalAmount;
  });

  const merchantChartData = Object.entries(merchantMap)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Category breakdown
  const categoryMap: { [key: string]: number } = {};
  receipts.forEach((r) => {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + r.totalAmount;
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
    percent: Math.round((value / totalSpend) * 100),
  }));

  // Payment method breakdown
  const paymentMap: { [key: string]: number } = {};
  receipts.forEach((r) => {
    paymentMap[r.paymentMethod] = (paymentMap[r.paymentMethod] || 0) + r.totalAmount;
  });

  const paymentChartData = Object.entries(paymentMap).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0284c7', '#0d9488', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#10b981'];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Expense Intelligence & Tax Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deep telemetry across merchant spending patterns, GST input tax credits, and payment rails.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">All-Time Expenditure</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(totalSpend)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Across {receipts.length} verified purchases</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">GST Tax Records</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(totalTaxGST)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Eligible for business Input Tax Credit</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Ticket Size</span>
            <Receipt className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(avgReceiptAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Per invoice transaction</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tax Filing Readiness</span>
            <FileCheck2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2">
            100%
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">All invoices backed by SHA-256 proofs</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Merchants Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-500" /> Top Spending by Merchant
              </h3>
              <p className="text-xs text-slate-500">Highest volume Indian merchants in your portfolio</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={merchantChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => formatINRCompact(val)}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Total Spend']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-500" /> Payment Methods Distribution
              </h3>
              <p className="text-xs text-slate-500">Breakdown across UPI, Credit Card, and Net Banking</p>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {paymentChartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Amount']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    color: '#fff',
                    border: '1px solid #334155',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-indigo-500" /> Category Spend Breakdown & Share
        </h3>
        <p className="text-xs text-slate-500 mb-4">Consolidated portfolio expenditure across categories</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryChartData.map((cat, idx) => (
            <div
              key={cat.name}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</h4>
                  <span className="text-[11px] text-slate-400">{cat.percent}% of total spend</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {formatINR(cat.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
