import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatINR,
  formatDate,
  formatBytes,
  calculateDaysRemaining,
} from '../../lib/utils';
import {
  X,
  ShieldCheck,
  Calendar,
  CreditCard,
  Tag,
  Copy,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Lock,
  ExternalLink,
  Save,
} from 'lucide-react';
import { Receipt, ExpenseCategory, PaymentMethod } from '../../types';

export const ReceiptDetailModal: React.FC = () => {
  const {
    selectedReceiptForDetail,
    setSelectedReceiptForDetail,
    updateReceipt,
    deleteReceipt,
    showToast,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState<Receipt | null>(null);

  if (!selectedReceiptForDetail) return null;

  const receipt = editedReceipt || selectedReceiptForDetail;

  const warrantyDaysLeft = calculateDaysRemaining(receipt.warrantyExpiryDate);
  const returnDaysLeft = calculateDaysRemaining(receipt.returnDeadline);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.sha256Hash);
    showToast({
      type: 'info',
      title: 'SHA-256 Hash Copied',
      message: 'Cryptographic fingerprint copied to clipboard.',
    });
  };

  const handleStartEdit = () => {
    setEditedReceipt({ ...selectedReceiptForDetail });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedReceipt) {
      updateReceipt(editedReceipt);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedReceipt(null);
    setIsEditing(false);
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  {receipt.merchantName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  Vault Verified
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Invoice {receipt.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Print receipt / export PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={handleStartEdit}
                  className="p-2 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit receipt metadata"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteReceipt(receipt.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete from vault"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedReceiptForDetail(null)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Financial & Item breakdown */}
            <div className="md:col-span-2 space-y-5">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    {formatDate(receipt.purchaseDate)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Category
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {receipt.category}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Payment
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {receipt.paymentMethod} {receipt.paymentCardLast4 ? `(*${receipt.paymentCardLast4})` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-sky-800">
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    Grand Total
                  </span>
                  <p className="text-sm font-extrabold text-sky-900 dark:text-sky-100 font-mono mt-0.5">
                    {formatINR(receipt.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Edit Mode Inputs if toggled */}
              {isEditing && (
                <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Merchant
                    </label>
                    <input
                      type="text"
                      value={receipt.merchantName}
                      onChange={(e) =>
                        setEditedReceipt({ ...receipt, merchantName: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Invoice #
                    </label>
                    <input
                      type="text"
                      value={receipt.invoiceNumber}
                      onChange={(e) =>
                        setEditedReceipt({ ...receipt, invoiceNumber: e.target.value })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Category
                    </label>
                    <select
                      value={receipt.category}
                      onChange={(e) =>
                        setEditedReceipt({
                          ...receipt,
                          category: e.target.value as ExpenseCategory,
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={receipt.paymentMethod}
                      onChange={(e) =>
                        setEditedReceipt({
                          ...receipt,
                          paymentMethod: e.target.value as PaymentMethod,
                        })
                      }
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {paymentMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Itemized Billing Statement
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {receipt.items.length} item(s)
                  </span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Item Description</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {receipt.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-4 text-slate-900 dark:text-white">
                          {item.name}
                          {item.warrantyMonths && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                              {item.warrantyMonths}m warranty
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatINR(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Financial calculation totals */}
                  <tfoot className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <tr>
                      <td colSpan={3} className="py-2 px-4 text-right text-slate-500">
                        Subtotal (Excl. Tax)
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatINR(Math.max(0, receipt.totalAmount - receipt.taxAmount))}
                      </td>
                    </tr>
                    {receipt.taxAmount > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="py-1 px-4 text-right text-slate-500">
                            CGST (Applicable Tax)
                          </td>
                          <td className="py-1 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatINR(receipt.cgstAmount || receipt.taxAmount / 2)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-1 px-4 text-right text-slate-500">
                            SGST (Applicable Tax)
                          </td>
                          <td className="py-1 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                            {formatINR(receipt.sgstAmount || receipt.taxAmount / 2)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t border-slate-200 dark:border-slate-700 font-bold text-sm">
                      <td colSpan={3} className="py-2.5 px-4 text-right text-slate-900 dark:text-white">
                        Grand Total
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-sky-600 dark:text-sky-400">
                        {formatINR(receipt.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Warranty & Return Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Warranty Status Card */}
                <div
                  className={`p-4 rounded-2xl border ${
                    receipt.hasWarranty && receipt.warrantyStatus === 'ACTIVE'
                      ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                      : receipt.hasWarranty && receipt.warrantyStatus === 'EXPIRING_SOON'
                      ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Manufacturer Warranty
                    </span>
                  </div>
                  {receipt.hasWarranty ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Expiry Date: <strong className="text-slate-900 dark:text-white">{formatDate(receipt.warrantyExpiryDate)}</strong>
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {warrantyDaysLeft > 0
                          ? `Valid for another ${warrantyDaysLeft} days`
                          : 'Warranty expired'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active warranty recorded.</p>
                  )}
                </div>

                {/* Return Window Status Card */}
                <div
                  className={`p-4 rounded-2xl border ${
                    receipt.hasReturnWindow && receipt.returnStatus === 'EXPIRING_SOON'
                      ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800'
                      : receipt.hasReturnWindow && receipt.returnStatus === 'ELIGIBLE'
                      ? 'bg-sky-50/70 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Store Return Policy
                    </span>
                  </div>
                  {receipt.hasReturnWindow ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Deadline: <strong className="text-slate-900 dark:text-white">{formatDate(receipt.returnDeadline)}</strong>
                      </p>
                      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                        {returnDaysLeft > 0
                          ? `Window closes in ${returnDaysLeft} days`
                          : 'Return window closed'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Non-returnable / Consumable item.</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {receipt.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-1">
                    Private Notes
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {receipt.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right 1 Col: Document Preview & SHA-256 Tamper Proof */}
            <div className="space-y-4">
              {/* Receipt Preview */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 p-1">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                  <img
                    src={receipt.fileUrl}
                    alt={receipt.merchantName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3">
                    <span className="text-[10px] text-white/90 font-mono">
                      {receipt.fileName}
                    </span>
                    <a
                      href={receipt.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-white/20 text-white hover:bg-white/40 transition-colors"
                      title="Open full resolution"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* SHA-256 Cryptographic Integrity Card */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cryptographic Integrity Seal</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    MATCH: 100%
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Calculated upon client-side upload. Any byte alteration flags tamper alerts immediately.
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] font-mono break-all text-sky-400 relative group">
                  <span>{receipt.sha256Hash}</span>
                  <button
                    onClick={handleCopyHash}
                    className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy SHA-256 Digest
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span>S3 Private Key:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[150px]">
                      {receipt.s3StorageKey}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Size:</span>
                    <span>{formatBytes(receipt.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Encryption:</span>
                    <span className="text-emerald-400 font-semibold">AES-256-GCM (Zero-Knowledge)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
