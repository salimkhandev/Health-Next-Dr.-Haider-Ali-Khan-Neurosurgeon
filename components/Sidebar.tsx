'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  FaUserInjured,
  FaStethoscope,
  FaProcedures,
  FaChartLine,
  FaCog,
  FaHeartbeat,
} from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FaChartLine },
  { name: 'Patients Directory', href: '/patients', icon: FaUserInjured },
  { name: 'New Consultation', href: '/consultation', icon: FaStethoscope },
  { name: 'Ward Management', href: '/wards', icon: FaProcedures },
  { name: 'Settings', href: '/settings', icon: FaCog },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname() ?? '';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed md:sticky top-0 left-0 z-50 md:z-30 shadow-lg md:shadow-none transition-transform duration-300 ease-in-out print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-red-500 p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <FaHeartbeat className="text-xl text-blue-600 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-none">
                  Nitro<span className="text-blue-600">Clinic</span>
                </h1>
                <p className="text-xs text-red-500 font-semibold tracking-wider uppercase mt-0.5">
                  Health Next
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Close sidebar"
              >
                <FiX className="text-xl" />
              </button>
            )}
          </div>

          {/* Doctor Info Card */}
          <div className="m-4 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 shrink-0 bg-slate-200">
              <Image
                src="/DR-IMAGE.png"
                alt="Dr. Haider Ali Khan"
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-slate-900 truncate">
                Dr. Haider Ali Khan
              </h2>
              <p className="text-[11px] font-medium text-blue-600 truncate">
                Neurosurgeon
              </p>
              <span className="inline-block mt-0.5 text-[9px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded">
                Health Next
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`text-base ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] text-slate-500 text-center font-medium">
            NitroClinic v1.0 &copy; 2026
          </p>
          <p className="text-[10px] text-slate-400 text-center mt-0.5">
            Neurosurgery Practice Suite
          </p>
        </div>
      </aside>
    </>
  );
}
