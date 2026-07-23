'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useNetwork } from '@/hooks/useNetwork';

const NAV_LINKS = [
  { href: '/courses', label: 'Courses' },
  { href: '/tutor', label: '🤖 AI Tutor' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnline = useNetwork();

  const isActive = (href: string) => pathname?.startsWith(href);

  // Determine which links to show based on network status
  const visibleNavLinks = isOnline 
    ? NAV_LINKS 
    : NAV_LINKS.filter(link => !link.href.startsWith('/courses') && !link.href.startsWith('/tutor'));

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 font-bold text-xl text-amber-500 no-underline tracking-tight flex items-center gap-2"
          >
            <Image src="/profile.jpg" alt="Sunrise Academy" width={32} height={32} className="rounded-md" />
            Sunrise Academy
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 flex-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors duration-150 ${
                  isActive(link.href)
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth actions / offline actions */}
          <div className="hidden md:flex gap-2 items-center flex-shrink-0">
            {!isOnline ? (
              <Link
                href="/downloads"
                className="text-sm font-semibold text-slate-950 bg-amber-500 no-underline px-4 py-1.5 rounded-md hover:bg-amber-600 transition-colors"
              >
                Offline Downloads
              </Link>
            ) : session ? (
              <>
                <Link
                  href={session.user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm text-slate-400 no-underline px-3 py-1.5 rounded-md hover:text-slate-300 transition-colors"
                >
                  {session.user.role === 'admin' ? 'Admin Panel' : 'My Learning'}
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm text-slate-500 bg-none border-none cursor-pointer px-3 py-1.5 hover:text-slate-400 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-400 no-underline px-3 py-1.5 rounded-md hover:text-slate-300 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-slate-950 bg-amber-500 no-underline px-4 py-1.5 rounded-md hover:bg-amber-600 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <nav className="flex flex-col gap-2 mb-4">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium no-underline transition-colors ${
                    isActive(link.href)
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-800">
              {!isOnline ? (
                <Link
                  href="/downloads"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-slate-950 bg-amber-500 no-underline px-4 py-2 rounded-md hover:bg-amber-600 transition-colors text-center"
                >
                  Offline Downloads
                </Link>
              ) : session ? (
                <>
                  <Link
                    href={session.user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-slate-400 no-underline px-3 py-2 rounded-md hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    {session.user.role === 'admin' ? 'Admin Panel' : 'My Learning'}
                  </Link>

                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setMenuOpen(false);
                    }}
                    className="text-sm text-slate-500 bg-none border-none cursor-pointer px-3 py-2 rounded-md hover:text-slate-400 hover:bg-slate-800 transition-colors text-left"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-slate-400 no-underline px-3 py-2 rounded-md hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-semibold text-slate-950 bg-amber-500 no-underline px-4 py-2 rounded-md hover:bg-amber-600 transition-colors text-center"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
