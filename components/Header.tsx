'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FiLogOut, FiBell, FiMenu } from 'react-icons/fi';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patients Directory',
  '/consultation': 'New Consultation',
  '/wards': 'Ward Management',
  '/settings': 'Settings',
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/patients/') && pathname.includes('/consult')) return 'New Consultation';
  if (pathname.startsWith('/patients/') && pathname.includes('/export')) return 'Patient History Export';
  if (pathname.startsWith('/patients/')) return 'Patient Profile';
  if (pathname.startsWith('/prescription/')) return 'Prescription Slip';
  if (pathname.startsWith('/wards')) return 'Ward Management';
  return 'NitroClinic';
}

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();
  const title = getTitle(pathname);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-xs print:hidden">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <FiMenu className="text-xl" />
          </button>
        )}
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-800 leading-tight">{title}</h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">
            Health Next · Neurosurgery Practice
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <FiBell className="text-base sm:text-lg" />
        </button>
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{session?.user?.name ?? 'Dr. Haider Ali Khan'}</p>
            <p className="text-[10px] text-slate-400">Neurosurgeon</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            aria-label="Sign out"
          >
            <FiLogOut className="text-base" />
          </button>
        </div>
      </div>
    </header>
  );
}
