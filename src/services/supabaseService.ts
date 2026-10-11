import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Receipt, Budget, ReceiptLineItem } from '../types';

/**
 * Supabase Database & Storage Service for Receipt Radar
 * Direct integration with PostgreSQL tables via Supabase PostgREST client
 */

export const dbFetchReceipts = async (userId: string): Promise<Receipt[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      receipt_line_items (*)
    `)
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('Error fetching receipts from Supabase:', error);
    throw error;
  }

  if (!data) return [];

  // Map Supabase snake_case DB fields to Receipt domain interface
  return data.map((row: any): Receipt => {
    const items: ReceiptLineItem[] = (row.receipt_line_items || []).map((li: any) => ({
      id: li.id,
      name: li.item_name,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unit_price),
      totalPrice: Number(li.total_price),
      category: li.category_override || undefined,
      warrantyMonths: li.warranty_months || undefined,
    }));

    return {
      id: row.id,
      merchantName: row.merchant_name,
      merchantLogo: row.merchant_logo || undefined,
      invoiceNumber: row.invoice_number,
      purchaseDate: row.purchase_date,
      totalAmount: Number(row.total_amount),
      taxAmount: Number(row.tax_amount || 0),
      cgstAmount: row.cgst_amount ? Number(row.cgst_amount) : undefined,
      sgstAmount: row.sgst_amount ? Number(row.sgst_amount) : undefined,
      currency: row.currency || 'INR',
      category: row.category,
      paymentMethod: row.payment_method,
      paymentCardLast4: row.card_last_4 || undefined,
      status: row.status,
      items,
      hasWarranty: Boolean(row.has_warranty),
      warrantyExpiryDate: row.warranty_expiry_date || undefined,
      warrantyStatus: row.warranty_status || 'NO_WARRANTY',
      warrantyDurationMonths: row.warranty_duration_months || undefined,
      hasReturnWindow: Boolean(row.has_return_window),
      returnDeadline: row.return_deadline || undefined,
      returnStatus: row.return_status || 'NOT_RETURNABLE',
      fileUrl: row.file_url || '',
      fileName: row.file_name || 'receipt.jpg',
      fileSize: Number(row.file_size_bytes || 0),
      fileMimeType: row.file_mime_type || 'image/jpeg',
      sha256Hash: row.sha256_hash,
      s3StorageKey: row.storage_key || '',
      isEncrypted: Boolean(row.is_client_encrypted),
      ocrConfidence: Number(row.ocr_confidence_score || 95),
      notes: row.notes || undefined,
      tags: row.tags || [],
      isDuplicateFlagged: Boolean(row.is_duplicate_flagged),
      duplicateOfReceiptId: row.duplicate_of_receipt_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
};

export const dbInsertReceipt = async (receipt: Receipt, userId: string): Promise<Receipt> => {
  if (!isSupabaseConfigured()) {
    return receipt;
  }

  // 1. Insert master receipt
  const receiptRecord = {
    user_id: userId,
    merchant_name: receipt.merchantName,
    invoice_number: receipt.invoiceNumber,
    purchase_date: receipt.purchaseDate,
    total_amount: receipt.totalAmount,
    tax_amount: receipt.taxAmount,
    cgst_amount: receipt.cgstAmount || 0,
    sgst_amount: receipt.sgstAmount || 0,
    currency: receipt.currency,
    category: receipt.category,
    payment_method: receipt.paymentMethod,
    card_last_4: receipt.paymentCardLast4 || null,
    status: receipt.status,
    has_warranty: receipt.hasWarranty,
    warranty_expiry_date: receipt.warrantyExpiryDate || null,
    warranty_status: receipt.warrantyStatus,
    warranty_duration_months: receipt.warrantyDurationMonths || 0,
    has_return_window: receipt.hasReturnWindow,
    return_deadline: receipt.returnDeadline || null,
    return_status: receipt.returnStatus,
    storage_arn: receipt.fileUrl || 'supabase-storage',
    storage_key: receipt.s3StorageKey || receipt.id,
    file_url: receipt.fileUrl,
    file_name: receipt.fileName,
    file_size_bytes: receipt.fileSize,
    file_mime_type: receipt.fileMimeType,
    sha256_hash: receipt.sha256Hash,
    is_client_encrypted: receipt.isEncrypted,
    ocr_confidence_score: receipt.ocrConfidence,
    notes: receipt.notes || null,
    tags: receipt.tags,
    is_duplicate_flagged: receipt.isDuplicateFlagged || false,
    duplicate_of_receipt_id: receipt.duplicateOfReceiptId || null,
  };

  const { data: insertedReceipt, error: receiptError } = await supabase
    .from('receipts')
    .insert(receiptRecord)
    .select()
    .single();

  if (receiptError) {
    console.error('Error inserting receipt to Supabase:', receiptError);
    throw receiptError;
  }

  // 2. Insert line items if present
  if (receipt.items && receipt.items.length > 0) {
    const lineItemRecords = receipt.items.map((item) => ({
      receipt_id: insertedReceipt.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      category_override: item.category || null,
      warranty_months: item.warrantyMonths || 0,
    }));

    const { error: lineItemError } = await supabase
      .from('receipt_line_items')
      .insert(lineItemRecords);

    if (lineItemError) {
      console.warn('Error inserting line items to Supabase:', lineItemError);
    }
  }

  return {
    ...receipt,
    id: insertedReceipt.id,
    createdAt: insertedReceipt.created_at,
    updatedAt: insertedReceipt.updated_at,
  };
};

export const dbDeleteReceipt = async (receiptId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', receiptId);

  if (error) {
    console.error('Error deleting receipt from Supabase:', error);
    throw error;
  }

  return true;
};

export const dbBulkDeleteReceipts = async (receiptIds: string[]): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const { error } = await supabase
    .from('receipts')
    .delete()
    .in('id', receiptIds);

  if (error) {
    console.error('Error bulk deleting receipts from Supabase:', error);
    throw error;
  }

  return true;
};

export const dbFetchBudget = async (userId: string): Promise<Budget | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .select(`
      *,
      budget_categories (*)
    `)
    .eq('user_id', userId)
    .eq('month_year', currentMonth)
    .single();

  if (budgetError && budgetError.code !== 'PGRST116') {
    console.warn('Error fetching budget from Supabase:', budgetError);
    return null;
  }

  if (!budgetData) return null;

  return {
    id: budgetData.id,
    month: budgetData.month_year,
    totalBudget: Number(budgetData.total_budget),
    categories: (budgetData.budget_categories || []).map((bc: any) => ({
      category: bc.category,
      allocatedAmount: Number(bc.allocated_amount),
      spentAmount: 0,
      color: '#38bdf8',
    })),
  };
};

export const dbSaveBudget = async (budget: Budget, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return true;
  }

  const monthYear = budget.month || new Date().toISOString().slice(0, 7);

  // Upsert budget
  const { data: upsertedBudget, error: budgetError } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: userId,
        month_year: monthYear,
        total_budget: budget.totalBudget,
      },
      { onConflict: 'user_id,month_year' }
    )
    .select()
    .single();

  if (budgetError) {
    console.error('Error saving budget to Supabase:', budgetError);
    return false;
  }

  // Upsert categories
  if (budget.categories && budget.categories.length > 0) {
    const categoryRecords = budget.categories.map((c) => ({
      budget_id: upsertedBudget.id,
      category: c.category,
      allocated_amount: c.allocatedAmount,
    }));

    await supabase
      .from('budget_categories')
      .upsert(categoryRecords, { onConflict: 'budget_id,category' });
  }

  return true;
};

export const dbUploadReceiptImage = async (
  file: File,
  userId: string
): Promise<{ fileUrl: string; storageKey: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      fileUrl: URL.createObjectURL(file),
      storageKey: `local_${Date.now()}_${file.name}`,
    };
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('receipts-vault')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.warn('Supabase storage upload fallback to local URL:', error);
    return {
      fileUrl: URL.createObjectURL(file),
      storageKey: fileName,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from('receipts-vault')
    .getPublicUrl(data.path);

  return {
    fileUrl: publicUrlData.publicUrl,
    storageKey: data.path,
  };
};
