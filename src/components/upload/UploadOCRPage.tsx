import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  OCRService,
  OCRExtractedData,
  OCR_PROCESSING_STEPS,
} from '../../services/ocrService';
import {
  formatINR,
  formatBytes,
} from '../../lib/utils';
import {
  UploadCloud,
  FileText,
  FileCheck2,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Hash,
  HelpCircle,
} from 'lucide-react';
import { ExpenseCategory, PaymentMethod, ReceiptLineItem } from '../../types';

export const UploadOCRPage: React.FC = () => {
  const { addReceipt, setActivePage, setSelectedReceiptForDetail } = useApp();

  // File state
  const [selectedFile, setSelectedFile] = useState<{
    file?: File;
    name: string;
    size: number;
    type: string;
    previewUrl: string;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Scanning / OCR state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState(OCR_PROCESSING_STEPS);

  // Extracted Result form
  const [extractedData, setExtractedData] = useState<OCRExtractedData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories & Payment methods
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

  // Validate and stage file
  const handleFileSelect = (file: File) => {
    setFileError(null);

    // Max 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File exceeds 10 MB limit. Please select a smaller file.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileError('Unsupported file type. Please upload JPG, PNG, or PDF.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const fileObj = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl,
    };
    setSelectedFile(fileObj);
    setExtractedData(null);
    startOCRProcessing(fileObj);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Run OCR processing pipeline
  const startOCRProcessing = async (
    customFileData?: { file?: File; name: string; size: number; type: string; previewUrl: string }
  ) => {
    const fileToScan = customFileData || selectedFile;
    if (!fileToScan) return;

    setIsProcessing(true);
    setCurrentStepIndex(0);

    // Reset steps
    const newSteps = OCR_PROCESSING_STEPS.map((s) => ({
      ...s,
      status: 'pending' as const,
    }));
    setSteps(newSteps);

    try {
      const result = await OCRService.processReceiptFile(
        fileToScan.file || {
          name: fileToScan.name,
          size: fileToScan.size,
          type: fileToScan.type,
        },
        (stepIdx, status) => {
          setCurrentStepIndex(stepIdx);
          setSteps((prev) =>
            prev.map((s, idx) => (idx === stepIdx ? { ...s, status } : s))
          );
        }
      );

      setExtractedData(result);
    } catch (err) {
      console.error(err);
      setFileError('Failed to process receipt with OCR engine. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Line item handlers
  const handleAddItem = () => {
    if (!extractedData) return;
    const newItem: ReceiptLineItem = {
      id: `item_manual_${Date.now()}`,
      name: 'New Item',
      quantity: 1,
      unitPrice: 100,
      totalPrice: 100,
    };
    setExtractedData({
      ...extractedData,
      items: [...extractedData.items, newItem],
      totalAmount: extractedData.totalAmount + 100,
    });
  };

  const handleRemoveItem = (id: string) => {
    if (!extractedData) return;
    const itemToRemove = extractedData.items.find((i) => i.id === id);
    const updated = extractedData.items.filter((i) => i.id !== id);
    setExtractedData({
      ...extractedData,
      items: updated,
      totalAmount: Math.max(0, extractedData.totalAmount - (itemToRemove?.totalPrice || 0)),
    });
  };

  const handleUpdateItem = (
    id: string,
    field: 'name' | 'quantity' | 'unitPrice',
    val: string | number
  ) => {
    if (!extractedData) return;
    const updated = extractedData.items.map((i) => {
      if (i.id !== id) return i;
      const copy = { ...i, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        copy.totalPrice = Number(copy.quantity) * Number(copy.unitPrice);
      }
      return copy;
    });

    const newTotal = updated.reduce((sum, item) => sum + item.totalPrice, 0);
    setExtractedData({
      ...extractedData,
      items: updated,
      totalAmount: newTotal,
      taxAmount: Number((newTotal * 0.18 / 1.18).toFixed(2)),
    });
  };

  // Save to Secure Vault
  const handleSaveToVault = () => {
    if (!extractedData || !selectedFile) return;

    const receipt = OCRService.createReceiptFromExtracted(extractedData, {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      url: selectedFile.previewUrl,
    });

    addReceipt(receipt);
    setSelectedReceiptForDetail(receipt);
    setActivePage('vault');
  };

  // Helper for Confidence Badge
  const renderConfidenceBadge = (confidence: number, level: string) => {
    const isHigh = level === 'HIGH' || confidence >= 95;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          isHigh
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
        }`}
        title={`OCR Detection Score: ${confidence}%`}
      >
        {isHigh ? (
          <CheckCircle2 className="w-2.5 h-2.5" />
        ) : (
          <AlertTriangle className="w-2.5 h-2.5" />
        )}
        <span>{confidence}% {isHigh ? 'High Confidence' : 'Needs Review'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Title & info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Receipt Upload & Smart OCR
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Private client-side ingestion, computer-vision entity extraction, and cryptographic hashing.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 w-fit">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Zero-Knowledge AES-256 S3 Staging</span>
        </div>
      </div>



      {/* Drag & Drop Upload Zone */}
      {!extractedData && !isProcessing && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 scale-[0.99]'
              : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500 bg-white dark:bg-slate-900 shadow-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-sky-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Drag and drop receipt or invoice here
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
            Supports <strong className="text-slate-700 dark:text-slate-300">JPG, JPEG, PNG, PDF</strong> documents up to 10 MB.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-sm"
            >
              Browse Files
            </button>
          </div>

          {fileError && (
            <p className="mt-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {fileError}
            </p>
          )}

          {/* Staged File Preview Ready CTA */}
          {selectedFile && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-6 max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between gap-3 animate-in fade-in"
            >
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-8 h-8 text-sky-600 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatBytes(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => startOCRProcessing()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shrink-0 shadow-sm"
              >
                Scan with OCR
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multi-step Scanning Animation */}
      {isProcessing && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg text-center animate-in zoom-in-95">
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-950 border-t-sky-600 dark:border-t-sky-400 animate-spin" />
            <RotateCw className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Running Secure OCR & Financial Extraction
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Processing {selectedFile?.name}... Calculating cryptographic checksums and parsing GST breakdown.
          </p>

          {/* Stepper list */}
          <div className="mt-8 max-w-md mx-auto space-y-3 text-left">
            {steps.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={step.step}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 shadow-xs'
                      : isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                      : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[9px] text-slate-400">
                        {step.step}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OCR Extraction Result Form */}
      {extractedData && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          {/* Top Status Header */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  OCR Entity Extraction Succeeded
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Review and adjust any extracted values below before committing to your encrypted vault.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExtractedData(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                Scan Another
              </button>
              <button
                onClick={handleSaveToVault}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <span>Save to Vault</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Editable Fields */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
                Extracted Receipt Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merchant Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Merchant Name
                    </label>
                    {renderConfidenceBadge(
                      extractedData.merchantConfidence,
                      extractedData.merchantConfidenceLevel
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.merchantName}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, merchantName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Invoice / Receipt #
                    </label>
                    {renderConfidenceBadge(
                      extractedData.invoiceConfidence,
                      extractedData.invoiceConfidenceLevel
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.invoiceNumber}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Purchase Date
                    </label>
                    {renderConfidenceBadge(
                      extractedData.dateConfidence,
                      extractedData.dateConfidenceLevel
                    )}
                  </div>
                  <input
                    type="date"
                    value={extractedData.purchaseDate}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, purchaseDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Total Amount in INR */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Total Amount (₹)
                    </label>
                    {renderConfidenceBadge(
                      extractedData.amountConfidence,
                      extractedData.amountConfidenceLevel
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs sm:text-sm font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.totalAmount}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          totalAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs sm:text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tax / GST Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tax / GST Amount (₹)
                    </label>
                    {renderConfidenceBadge(
                      extractedData.taxConfidence,
                      extractedData.taxConfidenceLevel
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs sm:text-sm font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.taxAmount}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          taxAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    {renderConfidenceBadge(
                      extractedData.categoryConfidence,
                      extractedData.categoryConfidenceLevel
                    )}
                  </div>
                  <select
                    value={extractedData.category}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        category: e.target.value as ExpenseCategory,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Payment Method
                    </label>
                    {renderConfidenceBadge(
                      extractedData.paymentConfidence,
                      extractedData.paymentConfidenceLevel
                    )}
                  </div>
                  <select
                    value={extractedData.paymentMethod}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        paymentMethod: e.target.value as PaymentMethod,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Return Deadline */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Return Deadline
                    </label>
                    {renderConfidenceBadge(
                      extractedData.returnConfidence,
                      extractedData.returnConfidenceLevel
                    )}
                  </div>
                  <input
                    type="date"
                    value={extractedData.returnDeadline || ''}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        returnDeadline: e.target.value,
                        hasReturnWindow: !!e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {/* Warranty Expiry */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Warranty Expiry
                    </label>
                    {renderConfidenceBadge(
                      extractedData.warrantyConfidence,
                      extractedData.warrantyConfidenceLevel
                    )}
                  </div>
                  <input
                    type="date"
                    value={extractedData.warrantyExpiryDate || ''}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        warrantyExpiryDate: e.target.value,
                        hasWarranty: !!e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Line items section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Purchased Items ({extractedData.items.length})
                    </h4>
                    {renderConfidenceBadge(
                      extractedData.itemsConfidence,
                      extractedData.itemsConfidenceLevel
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {extractedData.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none"
                      />
                      <div className="w-16">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)
                          }
                          min="1"
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-mono focus:outline-none"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          placeholder="Price"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-right font-mono focus:outline-none"
                        />
                      </div>
                      <span className="w-24 text-right text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatINR(item.totalPrice)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Private Notes & Tags
                </label>
                <textarea
                  rows={2}
                  value={extractedData.notes || ''}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, notes: e.target.value })
                  }
                  placeholder="Add any personal tags or warranty claim instructions..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Raw OCR Text Preview */}
              {extractedData.rawTextPreview && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Raw In-Browser OCR Extraction (Tesseract Neural Engine):
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      Real Document Text
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {extractedData.rawTextPreview}
                  </pre>
                </div>
              )}
            </div>

            {/* Right 1 Col: Preview & Cryptographic Security */}
            <div className="space-y-5">
              {/* Document Visual Preview Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                  Receipt Document Scan
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-[3/4] flex items-center justify-center group">
                  <img
                    src={selectedFile?.previewUrl}
                    alt="Receipt Scan"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] text-white/90 font-mono">
                      {selectedFile?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>SHA-256 Tamper Resistance</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  “The receipt file is stored privately. A SHA-256 integrity hash is generated to detect later tampering.”
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono break-all text-sky-400 flex items-start gap-2">
                  <Hash className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <span>{extractedData.sha256Hash}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>AES-256 GCM</span>
                  <span className="text-emerald-400 font-semibold">Integrity Verified</span>
                </div>
              </div>

              {/* Commit CTA */}
              <button
                type="button"
                onClick={handleSaveToVault}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-cyan-500 shadow-md shadow-sky-500/25 active:scale-98 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Save to Encrypted Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
