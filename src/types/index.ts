export type ExpenseCategory =
  | 'Electronics'
  | 'Food & Dining'
  | 'Groceries'
  | 'Travel & Commute'
  | 'Utilities & Telecom'
  | 'Healthcare & Wellness'
  | 'Entertainment'
  | 'Office & Business'
  | 'Shopping & Apparel';

export type PaymentMethod =
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Net Banking'
  | 'Cash';

export type WarrantyStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON' // Within 30 days
  | 'EXPIRED'
  | 'NO_WARRANTY';

export type ReturnStatus =
  | 'ELIGIBLE'
  | 'EXPIRING_SOON' // Within 3 days
  | 'EXPIRED'
  | 'NOT_RETURNABLE';

export type ReceiptStatus =
  | 'VERIFIED'
  | 'NEEDS_REVIEW'
  | 'DUPLICATE_FLAGGED'
  | 'PROCESSING';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OCRFieldResult<T> {
  value: T;
  confidence: number; // 0 to 100
  confidenceLevel: ConfidenceLevel;
  sourceBox?: { x: number; y: number; width: number; height: number };
}

export interface ReceiptLineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  warrantyMonths?: number;
}

export interface Receipt {
  id: string;
  merchantName: string;
  merchantLogo?: string;
  invoiceNumber: string;
  purchaseDate: string; // ISO date string YYYY-MM-DD
  totalAmount: number;
  taxAmount: number; // GST amount
  cgstAmount?: number;
  sgstAmount?: number;
  currency: string; // 'INR'
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  paymentCardLast4?: string;
  status: ReceiptStatus;
  
  // Line items
  items: ReceiptLineItem[];
  
  // Warranty & Return
  hasWarranty: boolean;
  warrantyExpiryDate?: string; // ISO date string
  warrantyStatus: WarrantyStatus;
  warrantyDurationMonths?: number;
  
  hasReturnWindow: boolean;
  returnDeadline?: string; // ISO date string
  returnStatus: ReturnStatus;
  
  // File & Cryptographic Security
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  fileMimeType: string;
  sha256Hash: string; // Cryptographic integrity proof
  s3StorageKey: string;
  isEncrypted: boolean;
  
  // Metadata & OCR
  ocrConfidence: number; // 0 to 100
  notes?: string;
  tags: string[];
  isDuplicateFlagged?: boolean;
  duplicateOfReceiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currencyPreference: string;
  monthlyBudget: number;
  encryptionKeyFingerprint: string;
  role: 'user' | 'admin';
  twoFactorEnabled: boolean;
}

export interface BudgetCategory {
  category: ExpenseCategory;
  allocatedAmount: number;
  spentAmount: number;
  color: string;
}

export interface Budget {
  id: string;
  month: string; // "2026-10"
  totalBudget: number;
  categories: BudgetCategory[];
}

export interface DuplicateAlert {
  id: string;
  originalReceiptId: string;
  duplicateReceiptId: string;
  merchantName: string;
  amount: number;
  date: string;
  confidence: number;
  detectedAt: string;
  status: 'PENDING' | 'RESOLVED_AS_DUPLICATE' | 'DISMISSED';
}

export interface OCRProcessingStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface ReceiptFilters {
  searchQuery: string;
  category: ExpenseCategory | 'ALL';
  merchant: string | 'ALL';
  paymentMethod: PaymentMethod | 'ALL';
  warrantyStatus: WarrantyStatus | 'ALL';
  returnStatus: ReturnStatus | 'ALL';
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'merchant_asc';
}

export interface SpendingTrendPoint {
  month: string;
  totalSpend: number;
  receiptCount: number;
  budgetLimit: number;
}
