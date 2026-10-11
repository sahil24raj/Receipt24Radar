import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'compact';
  className?: string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showTagline = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-extrabold',
    lg: 'text-2xl font-black',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Mark */}
      <div
        className={`relative flex items-center justify-center ${iconSizes[size]} rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800/80 dark:bg-slate-800 dark:ring-slate-700/80 transition-transform group-hover:scale-105 shrink-0 overflow-hidden`}
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

        {/* Custom Radar Vector Glyph */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-sky-400 relative z-10"
        >
          {/* Radar Scanner Arc 1 */}
          <path d="M12 2a10 10 0 0 1 10 10" className="opacity-40" />
          {/* Radar Scanner Arc 2 */}
          <path d="M12 6a6 6 0 0 1 6 6" className="opacity-70 text-sky-300" />
          {/* Target Center Receipt / Shield */}
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="text-white" strokeWidth="2" />
          {/* Checkmark verification pip */}
          <circle cx="12" cy="12" r="1.5" fill="#38bdf8" stroke="none" />
          <path d="m9.5 12 1.5 1.5 3.5-3.5" stroke="#0f172a" strokeWidth="2" className="dark:stroke-white" />
        </svg>

        {/* Corner radar ping */}
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 dark:ring-slate-800 animate-pulse" />
      </div>

      {/* Wordmark */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSizes[size]} tracking-tight text-slate-900 dark:text-white`}>
              Receipt<span className="text-sky-600 dark:text-sky-400 font-black">Radar</span>
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
              Expense Intelligence & Vault
            </span>
          )}
        </div>
      )}
    </div>
  );
};
