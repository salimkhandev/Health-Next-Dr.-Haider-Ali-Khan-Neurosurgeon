import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Brand mark */}
      <Link href="/" className="mb-8 flex flex-col items-center gap-1 group">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--brand-500)' }}
        >
          Sunrise Academy
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Learn Without Limits
        </span>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-8 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Sunrise Academy &mdash;{' '}
        <Link href="/terms" className="hover:underline">Terms</Link>
        {' · '}
        <Link href="/privacy" className="hover:underline">Privacy</Link>
      </p>
    </div>
  );
}
