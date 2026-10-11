import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatDate,
  calculateDaysRemaining,
} from '../../lib/utils';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UploadCloud,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Receipt, ExpenseCategory, WarrantyStatus, ReturnStatus, PaymentMethod } from '../../types';

export const ReceiptVaultPage: React.FC = () => {
  const {
    receipts,
    deleteReceipt,
    bulkDeleteReceipts,
    setSelectedReceiptForDetail,
    setActivePage,
    showToast,
  } = useApp();

  // Layout View State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyStatus | 'ALL'>('ALL');
  const [selectedReturn, setSelectedReturn] = useState<ReturnStatus | 'ALL'>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Unique merchants for dropdown filter
  const uniqueMerchants = useMemo(() => {
    const set = new Set(receipts.map((r) => r.merchantName));
    return Array.from(set).sort();
  }, [receipts]);

  // Filter & Search Logic
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      // Search across merchant, invoice, line items, amount
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesMerchant = r.merchantName.toLowerCase().includes(query);
        const matchesInvoice = r.invoiceNumber.toLowerCase().includes(query);
        const matchesItems = r.items.some((item) =>
          item.name.toLowerCase().includes(query)
        );
        const matchesAmount = r.totalAmount.toString().includes(query);
        const matchesNotes = r.notes?.toLowerCase().includes(query);

        if (!matchesMerchant && !matchesInvoice && !matchesItems && !matchesAmount && !matchesNotes) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) {
        return false;
      }

      // Merchant
      if (selectedMerchant !== 'ALL' && r.merchantName !== selectedMerchant) {
        return false;
      }

      // Payment method
      if (selectedPayment !== 'ALL' && r.paymentMethod !== selectedPayment) {
        return false;
      }

      // Warranty Status
      if (selectedWarranty !== 'ALL' && r.warrantyStatus !== selectedWarranty) {
        return false;
      }

      // Return Status
      if (selectedReturn !== 'ALL' && r.returnStatus !== selectedReturn) {
        return false;
      }

      // Min Amount
      if (minAmount && r.totalAmount < parseFloat(minAmount)) {
        return false;
      }

      // Max Amount
      if (maxAmount && r.totalAmount > parseFloat(maxAmount)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      }
      if (sortBy === 'amount_desc') {
        return b.totalAmount - a.totalAmount;
      }
      if (sortBy === 'amount_asc') {
        return a.totalAmount - b.totalAmount;
      }
      return 0;
    });
  }, [
    receipts,
    searchQuery,
    selectedCategory,
    selectedMerchant,
    selectedPayment,
    selectedWarranty,
    selectedReturn,
    minAmount,
    maxAmount,
    sortBy,
  ]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredReceipts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReceipts.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteReceipts(selectedIds);
    setSelectedIds([]);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0
      ? receipts.filter((r) => selectedIds.includes(r.id))
      : filteredReceipts;

    if (listToExport.length === 0) return;

    const headers = ['Merchant', 'InvoiceNumber', 'Date', 'Category', 'PaymentMethod', 'Amount_INR', 'Tax_GST_INR', 'WarrantyStatus', 'ReturnStatus', 'SHA256_Hash'];
    const rows = listToExport.map((r) => [
      `"${r.merchantName}"`,
      `"${r.invoiceNumber}"`,
      r.purchaseDate,
      `"${r.category}"`,
      r.paymentMethod,
      r.totalAmount,
      r.taxAmount,
      r.warrantyStatus,
      r.returnStatus,
      `"${r.sha256Hash}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `receipt_radar_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Export Generated',
      message: `${listToExport.length} receipts exported to CSV with GST & integrity hashes.`,
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedMerchant('ALL');
    setSelectedPayment('ALL');
    setSelectedWarranty('ALL');
    setSelectedReturn('ALL');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== 'ALL' ||
    selectedMerchant !== 'ALL' ||
    selectedPayment !== 'ALL' ||
    selectedWarranty !== 'ALL' ||
    selectedReturn !== 'ALL' ||
    minAmount ||
    maxAmount;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Encrypted Receipt Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Searchable repository with tamper-evident cryptographic hashes & warranty lifecycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
            title="Export filtered receipts as CSV for taxation"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Export</span> CSV
          </button>

          <button
            onClick={() => setActivePage('upload')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Receipt</span>
          </button>
        </div>
      </div>

      {/* Search & Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, invoice #, item name, amount..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Controls: Filter toggle, Sort, View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isFilterOpen || hasActiveFilters
                  ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none pr-8 cursor-pointer"
              >
                <option value="date_desc">Latest Date</option>
                <option value="date_asc">Oldest Date</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* View Grid/List toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Grid layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Table list layout"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Filter Drawer */}
        {isFilterOpen && (
          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in">
            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Travel & Commute">Travel & Commute</option>
                <option value="Utilities & Telecom">Utilities & Telecom</option>
                <option value="Healthcare & Wellness">Healthcare</option>
                <option value="Shopping & Apparel">Shopping</option>
              </select>
            </div>

            {/* Merchant Filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Merchant
              </label>
              <select
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Merchants</option>
                {uniqueMerchants.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Warranty Status */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Warranty
              </label>
              <select
                value={selectedWarranty}
                onChange={(e) => setSelectedWarranty(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Warranty</option>
                <option value="EXPIRING_SOON">Expiring Soon (30d)</option>
                <option value="EXPIRED">Expired</option>
                <option value="NO_WARRANTY">No Warranty</option>
              </select>
            </div>

            {/* Return Status */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Return Window
              </label>
              <select
                value={selectedReturn}
                onChange={(e) => setSelectedReturn(e.target.value as any)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">All Return Windows</option>
                <option value="ELIGIBLE">Return Eligible</option>
                <option value="EXPIRING_SOON">Expiring Soon (3d)</option>
                <option value="EXPIRED">Window Closed</option>
                <option value="NOT_RETURNABLE">Non-returnable</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Min Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
              </input>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Max Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
              </input>
            </div>
          </div>
        )}

        {/* Bulk Action Strip */}
        {selectedIds.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs animate-in fade-in">
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              {selectedIds.length} of {filteredReceipts.length} receipts selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 font-semibold flex items-center gap-1.5 hover:bg-emerald-100"
              >
                <Download className="w-3.5 h-3.5" />
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 font-semibold flex items-center gap-1.5 hover:bg-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Select All toggle banner */}
      {filteredReceipts.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={
                selectedIds.length > 0 &&
                selectedIds.length === filteredReceipts.length
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
            />
            <span>Select All ({filteredReceipts.length} receipts)</span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredReceipts.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No receipts found matching criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or upload a new purchase receipt to your vault.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setActivePage('upload')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm"
            >
              Upload Your First Receipt
            </button>
          </div>
        </div>
      )}

      {/* 1. Grid View Layout */}
      {viewMode === 'grid' && filteredReceipts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredReceipts.map((rcpt) => {
            const isSelected = selectedIds.includes(rcpt.id);
            const warrantyDays = calculateDaysRemaining(rcpt.warrantyExpiryDate);
            const returnDays = calculateDaysRemaining(rcpt.returnDeadline);

            return (
              <div
                key={rcpt.id}
                onClick={() => setSelectedReceiptForDetail(rcpt)}
                className={`relative rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 cursor-pointer overflow-hidden group hover:shadow-lg ${
                  isSelected
                    ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Top preview thumbnail & quick select */}
                <div className="relative h-40 bg-slate-100 dark:bg-slate-950 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                  <img
                    src={rcpt.fileUrl}
                    alt={rcpt.merchantName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Top Bar inside card */}
                  <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent flex items-center justify-between">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(rcpt.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-white/60 bg-black/40"
                      />
                    </div>

                    {/* Category tag */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 dark:bg-slate-900/90 dark:text-slate-200 backdrop-blur-xs">
                      {rcpt.category}
                    </span>
                  </div>

                  {/* SHA-256 seal bottom-right */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1 backdrop-blur-xs border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>SHA-256</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {rcpt.merchantName}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {rcpt.invoiceNumber} • {formatDate(rcpt.purchaseDate)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatINR(rcpt.totalAmount)}
                      </span>
                      {rcpt.taxAmount > 0 && (
                        <p className="text-[10px] text-slate-400">
                          GST: {formatINR(rcpt.taxAmount)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Item preview */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {rcpt.items.map((i) => i.name).join(', ')}
                  </p>

                  {/* Badges for Warranty & Return */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {rcpt.hasWarranty && rcpt.warrantyStatus === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Warranty: {warrantyDays}d left</span>
                      </span>
                    )}

                    {rcpt.hasWarranty && rcpt.warrantyStatus === 'EXPIRING_SOON' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Warranty: {warrantyDays}d left!</span>
                      </span>
                    )}

                    {rcpt.hasReturnWindow && rcpt.returnStatus === 'EXPIRING_SOON' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Return: {returnDays}d left!</span>
                      </span>
                    )}

                    {rcpt.hasReturnWindow && rcpt.returnStatus === 'ELIGIBLE' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <span>Return Eligible</span>
                      </span>
                    )}

                    {rcpt.isDuplicateFlagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Duplicate Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. List View Layout */}
      {viewMode === 'list' && filteredReceipts.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === filteredReceipts.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                </th>
                <th className="py-3 px-3">Merchant</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status / Alerts</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredReceipts.map((rcpt) => {
                const isSelected = selectedIds.includes(rcpt.id);
                return (
                  <tr
                    key={rcpt.id}
                    onClick={() => setSelectedReceiptForDetail(rcpt)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(rcpt.id)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {rcpt.merchantName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {rcpt.invoiceNumber}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {rcpt.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(rcpt.purchaseDate)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
                      {rcpt.items.map((i) => i.name).join(', ')}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatINR(rcpt.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3">
                      {rcpt.hasWarranty && rcpt.warrantyStatus === 'ACTIVE' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                          Warranty Active
                        </span>
                      )}
                      {rcpt.hasWarranty && rcpt.warrantyStatus === 'EXPIRING_SOON' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                          Warranty Alert
                        </span>
                      )}
                      {rcpt.hasReturnWindow && rcpt.returnStatus === 'EXPIRING_SOON' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                          Return Closing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptForDetail(rcpt)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReceipt(rcpt.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
