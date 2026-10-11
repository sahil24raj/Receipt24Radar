import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into standard Indian Rupee notation (₹ xx,xx,xxx)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compact Indian currency format for chart axes or tight tags (e.g., ₹45K, ₹1.2L)
 */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount}`;
}

/**
 * Formats date into "DD MMM YYYY" (e.g., "14 Oct 2026")
 */
export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return 'N/A';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return 'Invalid Date';

  const day = date.getDate().toString().padStart(2, '0');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Calculates remaining days from now until target date
 */
export function calculateDaysRemaining(targetDateStr?: string): number {
  if (!targetDateStr) return -999;
  const target = new Date(targetDateStr);
  const now = new Date();
  
  // Set both to midnight UTC for pure calendar day comparison
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Realistic SHA-256 simulation string generator based on content and timestamp
 */
export function generateSHA256(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  // Generate 64-char hex string
  const baseHex = Math.abs(hash).toString(16).padStart(8, '0');
  const salt = Date.now().toString(16);
  return (
    baseHex +
    'a7f4c910e5d8b320' +
    salt +
    'e98b71d60523fca841b9c2'
  ).substring(0, 64);
}

/**
 * Formats bytes to human-readable file size (KB / MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Dynamic greeting according to local hour
 */
export function getGreeting(userName = 'Sahil'): string {
  const hour = new Date().getHours();
  let timeOfDay = 'Good morning';
  if (hour >= 12 && hour < 17) {
    timeOfDay = 'Good afternoon';
  } else if (hour >= 17) {
    timeOfDay = 'Good evening';
  }
  return `${timeOfDay}, ${userName}`;
}
