import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod, Receipt } from '../../types';
import { generateSHA256 } from '../../lib/utils';
import { X, PlusCircle, ShieldCheck } from 'lucide-react';

export const ManualExpenseModal: React.FC = () => {
  const {
    isManualModalOpen,
    setIsManualModalOpen,
    addReceipt,
    setSelectedReceiptForDetail,
    setActivePage,
  } = useApp();

  const [formData, setFormData] = useState({
    merchantName: '',
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    purchaseDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    taxAmount: '',
    category: 'Food & Dining' as ExpenseCategory,
    paymentMethod: 'UPI' as PaymentMethod,
    itemName: '',
    hasWarranty: false,
    warrantyExpiryDate: '',
    hasReturnWindow: false,
    returnDeadline: '',
    notes: '',
  });

  if (!isManualModalOpen) return null;

  const categories: ExpenseCategory[] = [
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

  const paymentMethods: PaymentMethod[] = [
    'UPI',
    'Credit Card',
    'Debit Card',
    'Net Banking',
    'Cash',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchantName || !formData.totalAmount) return;

    const total = parseFloat(formData.totalAmount) || 0;
    const tax = parseFloat(formData.taxAmount) || (total * 0.18 / 1.18);
    const id = `rcpt_manual_${Date.now()}`;
    const hash = generateSHA256(formData.merchantName + total + Date.now());

    const newReceipt: Receipt = {
      id,
      merchantName: formData.merchantName,
      invoiceNumber: formData.invoiceNumber,
      purchaseDate: formData.purchaseDate,
      totalAmount: total,
      taxAmount: Number(tax.toFixed(2)),
      cgstAmount: Number((tax / 2).toFixed(2)),
      sgstAmount: Number((tax / 2).toFixed(2)),
      currency: 'INR',
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      status: 'VERIFIED',
      items: [
        {
          id: `item_${Date.now()}`,
          name: formData.itemName || `${formData.merchantName} Purchase`,
          quantity: 1,
          unitPrice: total,
          totalPrice: total,
        },
      ],
      hasWarranty: formData.hasWarranty,
      warrantyExpiryDate: formData.hasWarranty ? formData.warrantyExpiryDate : undefined,
      warrantyStatus: formData.hasWarranty ? 'ACTIVE' : 'NO_WARRANTY',
      hasReturnWindow: formData.hasReturnWindow,
      returnDeadline: formData.hasReturnWindow ? formData.returnDeadline : undefined,
      returnStatus: formData.hasReturnWindow ? 'ELIGIBLE' : 'NOT_RETURNABLE',
      fileUrl: 'https://images.unsplash.com/photo-1554415707-9e4c0199e525?w=800&auto=format&fit=crop&q=80',
      fileName: 'manual_entry_voucher.pdf',
      fileSize: 120000,
      fileMimeType: 'application/pdf',
      sha256Hash: hash,
      s3StorageKey: `vault/usr_sahil_99/manual/${id}.enc`,
      isEncrypted: true,
      ocrConfidence: 100,
      notes: formData.notes,
      tags: ['manual', 'direct-entry'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReceipt(newReceipt);
    setIsManualModalOpen(false);
    setSelectedReceiptForDetail(newReceipt);
    setActivePage('vault');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-emerald-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Add Expense Manually
            </h3>
          </div>
          <button
            onClick={() => setIsManualModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Merchant Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy, Reliance Digital, Uber..."
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="₹ Amount"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs sm:text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                required
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none"
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Primary Item Description
            </label>
            <input
              type="text"
              placeholder="e.g. Wireless Mouse, Grocery Basket..."
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:outline-none"
            />
          </div>

          {/* Warranty checkbox & date */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.hasWarranty}
                onChange={(e) => setFormData({ ...formData, hasWarranty: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600"
              />
              <span>Includes Product Warranty</span>
            </label>
            {formData.hasWarranty && (
              <input
                type="date"
                placeholder="Warranty Expiry"
                value={formData.warrantyExpiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, warrantyExpiryDate: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            )}
          </div>

          {/* Return window checkbox & date */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.hasReturnWindow}
                onChange={(e) =>
                  setFormData({ ...formData, hasReturnWindow: e.target.checked })
                }
                className="w-4 h-4 rounded text-sky-600"
              />
              <span>Includes Return / Exchange Window</span>
            </label>
            {formData.hasReturnWindow && (
              <input
                type="date"
                placeholder="Return Deadline"
                value={formData.returnDeadline}
                onChange={(e) => setFormData({ ...formData, returnDeadline: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-md shadow-sky-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Store into Vault</span>
          </button>
        </form>
      </div>
    </div>
  );
};
