'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }

    // Use window.location.href to force a full page load through the proxy middleware,
    // which will correctly route admins to /admin and students to /dashboard.
    window.location.href = '/dashboard';
  }

  return (
    <div className="card">
      <div className="mb-4">
        <Link href="/" className="text-xs text-muted hover:underline">
          ← Back to Home
        </Link>
      </div>
      <h1
        className="text-2xl font-bold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Welcome back
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Sign in to continue learning
      </p>

      {error && <div className="alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs"
              style={{ color: 'var(--brand-400)' }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn-primary mt-2" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: 'var(--brand-400)' }} className="hover:underline font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}
