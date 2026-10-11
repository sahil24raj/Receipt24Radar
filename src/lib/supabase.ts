import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or custom user-provided localStorage values
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const getStoredConfig = () => {
  try {
    const customUrl = localStorage.getItem('receipt_radar_supabase_url');
    const customKey = localStorage.getItem('receipt_radar_supabase_anon_key');
    return {
      url: customUrl || envUrl || '',
      key: customKey || envKey || '',
      isCustom: Boolean(customUrl && customKey),
    };
  } catch {
    return { url: envUrl, key: envKey, isCustom: false };
  }
};

let currentConfig = getStoredConfig();

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = currentConfig;
  return (
    Boolean(url) &&
    Boolean(key) &&
    url !== 'https://your-project-id.supabase.co' &&
    key !== 'your-anon-public-key' &&
    url.startsWith('https://')
  );
};

// Fallback dummy client if credentials aren't configured yet (to prevent runtime crash)
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-anon-key';

export let supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? currentConfig.url : fallbackUrl,
  isSupabaseConfigured() ? currentConfig.key : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const getSupabaseConfig = () => {
  return {
    url: currentConfig.url,
    key: currentConfig.key,
    isConfigured: isSupabaseConfigured(),
    isCustom: currentConfig.isCustom,
  };
};

export const setSupabaseConfig = (url: string, key: string) => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();
  
  localStorage.setItem('receipt_radar_supabase_url', cleanUrl);
  localStorage.setItem('receipt_radar_supabase_anon_key', cleanKey);
  
  currentConfig = {
    url: cleanUrl,
    key: cleanKey,
    isCustom: true,
  };

  supabase = createClient(
    isSupabaseConfigured() ? currentConfig.url : fallbackUrl,
    isSupabaseConfigured() ? currentConfig.key : fallbackKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('receipt_radar_supabase_url');
  localStorage.removeItem('receipt_radar_supabase_anon_key');
  currentConfig = getStoredConfig();
  
  supabase = createClient(
    isSupabaseConfigured() ? currentConfig.url : fallbackUrl,
    isSupabaseConfigured() ? currentConfig.key : fallbackKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
};
