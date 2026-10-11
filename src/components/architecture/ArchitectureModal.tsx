import React, { useState } from 'react';
import { POSTGRES_SCHEMA_SQL } from '../../services/dbSchema';
import {
  Database,
  ShieldCheck,
  HardDrive,
  Key,
  Copy,
  Check,
  Server,
  FileCode,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ArchitectureModal: React.FC = () => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'sql' | 'storage' | 'auth'>('sql');

  const handleCopySQL = () => {
    navigator.clipboard.writeText(POSTGRES_SCHEMA_SQL);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'SQL Schema Copied',
      message: 'PostgreSQL DDL schema copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Database className="w-7 h-7 text-sky-500" />
          Production Relational & Storage Architecture
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          PostgreSQL 16+ relational schema, private AWS S3 object vault design, and zero-knowledge encryption guarantees.
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider">
            <Server className="w-4 h-4" /> Relational Postgres
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Normalized 3NF + Row Level Security
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-tenant strict data isolation enforced at the database kernel level with Postgres RLS policies.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <HardDrive className="w-4 h-4" /> Object Storage S3
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Private Bucket + Pre-signed URLs
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Zero public read access. Ephemeral short-lived pre-signed URLs generated strictly on client request.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
            <Key className="w-4 h-4" /> Cryptographic Integrity
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            SHA-256 Tamper Resistance
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Client computes digest before dispatch. Any server-side mutation or corruption is immediately flagged.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'sql'
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PostgreSQL DDL (SQL)
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'storage'
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              S3 Private Storage Pipeline
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'auth'
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              JWT & Auth Security
            </button>
          </div>

          {activeTab === 'sql' && (
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy DDL'}</span>
            </button>
          )}
        </div>

        {activeTab === 'sql' && (
          <div className="relative">
            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed max-h-[500px]">
              <code>{POSTGRES_SCHEMA_SQL}</code>
            </pre>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Private Cloud Storage (AWS S3 / GCP Storage Equivalent)
            </h4>
            <p>
              1. <strong>Direct Client Ingestion via Pre-signed PUT:</strong> The client requests an upload authorization token with SHA-256 metadata. The API server generates an AWS S3 pre-signed URL with an exact 5-minute TTL.
            </p>
            <p>
              2. <strong>Server-Side Encryption with KMS:</strong> All objects are tagged with <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600">x-amz-server-side-encryption: aws:kms</code> and customer-managed keys (CMK) rotated automatically annually.
            </p>
            <p>
              3. <strong>Tamper Verification Lifecycle:</strong> Before any OCR processing begins or receipt is downloaded, the computed sha256 checksum is compared with the database master hash. If a checksum mismatch occurs, the receipt is locked and an audit alert is logged.
            </p>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Authentication & Password Hashing Standard
            </h4>
            <p>
              1. <strong>Password Hashing:</strong> Utilizes Argon2id (memory cost 64MB, time cost 3 iterations, parallelism 4) with per-user cryptographic salts.
            </p>
            <p>
              2. <strong>Stateless JWT Tokens:</strong> Short-lived Access Tokens (15-minute expiration) paired with HttpOnly SameSite=Strict Refresh Tokens rotated on every renewal to prevent token reuse attacks.
            </p>
            <p>
              3. <strong>Row-Level Security (RLS) Integration:</strong> The Postgres connection pool sets <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-sky-600">SET LOCAL request.jwt.claim.sub = user_id</code> ensuring physical separation of data across all queries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
