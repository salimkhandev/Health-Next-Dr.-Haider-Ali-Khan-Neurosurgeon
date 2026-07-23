import Link from 'next/link';
import Image from 'next/image';

const LINKS = [
  { href: '/courses', label: 'Courses' },
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/refund', label: 'Refund Policy' },
];

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800 px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/profile.jpg" alt="Sunrise Academy" width={40} height={40} className="rounded-md" />
          <div>
            <p className="font-bold text-lg text-amber-500">Sunrise Academy</p>
            <p className="text-xs text-slate-500 mt-1">Learn Without Limits</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-4 sm:gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-500 no-underline hover:text-slate-400 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Sunrise Academy. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
