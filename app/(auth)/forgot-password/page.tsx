'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Always show success — API returns the same message regardless
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="card">
      <div className="mb-4">
        <Link href="/login" className="text-xs text-muted hover:underline">
          ← Back to Login
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Forgot password?
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>

      {submitted ? (
        <div className="alert-success">
          If that email is registered, a reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <Link href="/login" style={{ color: 'var(--brand-400)' }} className="hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
