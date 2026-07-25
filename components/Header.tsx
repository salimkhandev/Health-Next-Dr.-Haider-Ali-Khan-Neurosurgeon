'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FiLogOut, FiMenu } from 'react-icons/fi';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patients',
  '/consultation': 'Consultation',
  '/wards': 'Wards',
  '/settings': 'Settings',
};

const pageTitlesFull: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patients Directory',
  '/consultation': 'New Consultation',
  '/wards': 'Ward Management',
  '/settings': 'Settings',
};

function getTitle(pathname: string, short = false) {
  const map = short ? pageTitles : pageTitlesFull;
  if (map[pathname]) return map[pathname];
  if (pathname.startsWith('/patients/') && pathname.includes('/consult')) return short ? 'Consult' : 'New Consultation';
  if (pathname.startsWith('/patients/') && pathname.includes('/export')) return short ? 'Export' : 'Patient Export';
  if (pathname.startsWith('/patients/')) return short ? 'Profile' : 'Patient Profile';
  if (pathname.startsWith('/prescription/')) return short ? 'Rx Slip' : 'Prescription Slip';
  if (pathname.startsWith('/wards')) return short ? 'Wards' : 'Ward Management';
  return 'Health Next';
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();

  return (
    <header className="h-12 sm:h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-20 shadow-xs print:hidden">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <FiMenu className="text-lg" />
          </button>
        )}
        <div className="min-w-0">
          {/* Short title on mobile, full on sm+ */}
          <h1 className="text-sm font-semibold text-slate-800 leading-tight truncate block sm:hidden">
            {getTitle(pathname, true)}
          </h1>
          <h1 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight truncate hidden sm:block">
            {getTitle(pathname, false)}
          </h1>
          <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
            Health Next · Neurosurgery
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Name only on sm+ */}
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
              {session?.user?.name ?? 'Dr. Haider Ali Khan'}
            </p>
            <p className="text-[10px] text-slate-400">Neurosurgeon</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Sign out"
          >
            <FiLogOut className="text-sm sm:text-base" />
          </button>
        </div>
      </div>
    </header>
  );
}
