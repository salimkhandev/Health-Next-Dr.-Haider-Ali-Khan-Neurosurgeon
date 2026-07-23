'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: form.password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to reset password.');
      return;
    }

    router.push('/login?reset=1');
  }

  return (
    <div className="card">
      <div className="mb-4">
        <Link href="/login" className="text-xs text-muted hover:underline">
          ← Back to Login
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Set new password
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Choose a strong password for your account.
      </p>

      {error && (
        <div className="alert-error mb-4">
          {error}{' '}
          {(error.includes('expired') || error.includes('Invalid')) && (
            <Link href="/forgot-password" style={{ color: 'var(--brand-400)' }} className="underline ml-1">
              Request a new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            New password
          </label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 chars, 1 letter, 1 number"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Confirm new password
          </label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={(e) => update('confirm', e.target.value)}
            required
          />
        </div>

        <button className="btn-primary mt-2" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
