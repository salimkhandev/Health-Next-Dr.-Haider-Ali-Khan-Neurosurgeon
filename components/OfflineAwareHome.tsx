'use client';

import { useNetwork } from '@/hooks/useNetwork';
import Link from 'next/link';
import { Download, BookOpen, FileText, ShieldCheck, RefreshCcw } from 'lucide-react';

const OFFLINE_PAGES = [
  {
    href: '/downloads',
    icon: <Download className="w-8 h-8 text-amber-500" />,
    label: 'Offline Downloads',
    desc: 'Watch your downloaded videos — no internet needed.',
    highlight: true,
  },
  {
    href: '/about',
    icon: <BookOpen className="w-6 h-6 text-slate-400" />,
    label: 'About Us',
    desc: 'Learn more about Sunrise Academy.',
    highlight: false,
  },
  {
    href: '/terms',
    icon: <FileText className="w-6 h-6 text-slate-400" />,
    label: 'Terms & Conditions',
    desc: 'Read our terms of service.',
    highlight: false,
  },
  {
    href: '/refund',
    icon: <ShieldCheck className="w-6 h-6 text-slate-400" />,
    label: 'Refund Policy',
    desc: 'Understand our refund policy.',
    highlight: false,
  },
];

export default function OfflineAwareHome({ children }: { children: React.ReactNode }) {
  const isOnline = useNetwork();

  if (isOnline) return <>{children}</>;

  // Offline overlay — shown instead of the full landing page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">
      {/* Offline indicator */}
      <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase mb-8">
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
        You are offline
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-3">
        No internet connection
      </h1>
      <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto mb-12">
        Don't worry — your downloaded videos are still available. Visit the pages below that work without internet.
      </p>

      {/* Available offline pages */}
      <div className="w-full max-w-md flex flex-col gap-4 mb-12">
        {OFFLINE_PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className={`flex items-center gap-4 text-left px-5 py-4 rounded-xl no-underline transition-all border ${
              page.highlight
                ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                : 'bg-slate-900 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="shrink-0">{page.icon}</div>
            <div>
              <div className={`font-semibold text-base ${page.highlight ? 'text-amber-400' : 'text-slate-200'}`}>
                {page.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{page.desc}</div>
            </div>
            <span className="ml-auto text-slate-500">→</span>
          </Link>
        ))}
      </div>

      {/* Retry button */}
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-2.5 border border-slate-700 text-slate-400 rounded-xl text-sm font-medium hover:border-slate-500 hover:text-slate-300 transition-colors"
      >
        <RefreshCcw className="w-4 h-4" />
        Retry connection
      </button>
    </div>
  );
}
