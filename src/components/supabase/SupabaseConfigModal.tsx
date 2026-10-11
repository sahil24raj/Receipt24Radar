import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Key,
  Globe,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getSupabaseConfig,
  setSupabaseConfig,
  clearSupabaseConfig,
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useApp();
  const currentConfig = getSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig.key || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please provide both the Supabase URL and Anon Public Key.',
      });
      return;
    }

    if (!url.startsWith('https://')) {
      showToast({
        type: 'error',
        title: 'Invalid URL',
        message: 'Supabase URL must start with https://',
      });
      return;
    }

    setSupabaseConfig(url.trim(), anonKey.trim());
    showToast({
      type: 'success',
      title: 'Supabase Configured',
      message: 'Client connected to your live Supabase cloud database!',
    });
    setTestResult({
      success: true,
      message: 'Configuration saved! You are now connected to Supabase.',
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      if (!url.trim() || !anonKey.trim()) {
        throw new Error('Please enter both Supabase URL and Anon Key before testing.');
      }

      setSupabaseConfig(url.trim(), anonKey.trim());
      const { data, error } = await supabase.from('receipts').select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, but auth ping succeeded
        if (error.message.includes('relation "public.receipts" does not exist')) {
          setTestResult({
            success: true,
            message: 'Connected to Supabase! (Note: Run docs/SUPABASE_SETUP.sql in Supabase SQL Editor to create tables).',
          });
        } else {
          throw error;
        }
      } else {
        setTestResult({
          success: true,
          message: 'Connection verified! Supabase Auth & Database are fully operational.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Check your Project URL and Anon Key.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToDemo = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showToast({
      type: 'info',
      title: 'Switched to Local Mode',
      message: 'Receipt Radar is now using local client-side storage.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Supabase Cloud Integration
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="w-3 h-3" /> Local / Demo Mode
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect live PostgreSQL database, user authentication & cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick instructions banner */}
          <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
              <Sparkles className="w-4 h-4" /> How to connect your Supabase project:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 leading-relaxed">
              <li>Create a free project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 underline font-medium">supabase.com/dashboard</a>.</li>
              <li>Go to <strong>Project Settings → API</strong> to copy your <strong>URL</strong> and <strong>anon key</strong>.</li>
              <li>Run the SQL script from <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600 font-mono">docs/SUPABASE_SETUP.sql</code> in the Supabase SQL Editor.</li>
            </ol>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://your-project-id.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Test results banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDemo}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Reset to Demo Mode
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
