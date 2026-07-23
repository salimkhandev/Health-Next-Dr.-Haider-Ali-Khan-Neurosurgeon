'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export default function AdminNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { label: 'Payments & Approvals', href: '/admin' },
    { label: 'Course Manager', href: '/admin/courses' },
    { label: 'Student Management', href: '/admin/students' },
  ];

  return (
    <nav style={{
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--surface-2)',
      padding: '0.875rem 1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Top row: brand + hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin" style={{ color: 'var(--brand-500)', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' }}>
          Sunrise Academy{' '}
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8em', fontWeight: 500 }}>Admin</span>
        </Link>

        {/* Desktop nav links */}
        <div className="admin-nav-links">
          {links.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? 'var(--brand-400)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--brand-400)' : '2px solid transparent',
                  paddingBottom: '0.2rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="admin-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: '1px solid var(--surface-2)',
            borderRadius: '0.4rem',
            padding: '0.35rem 0.6rem',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            lineHeight: 1,
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="admin-mobile-menu"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            paddingTop: '0.75rem',
            marginTop: '0.75rem',
            borderTop: '1px solid var(--surface-2)',
          }}
        >
          {links.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: isActive ? 'rgba(var(--brand-rgb, 249,115,22), 0.12)' : 'transparent',
                  color: isActive ? 'var(--brand-400)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              display: 'block',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.5rem',
              color: '#ef4444',
              fontWeight: 500,
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Sign Out
          </button>
        </div>
      )}

      <style>{`
        .admin-nav-links {
          display: none;
          align-items: center;
          gap: 1.5rem;
        }
        .admin-hamburger {
          display: flex;
        }
        @media (min-width: 768px) {
          .admin-nav-links {
            display: flex;
          }
          .admin-hamburger {
            display: none !important;
          }
          .admin-mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
