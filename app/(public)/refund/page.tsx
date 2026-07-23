import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy — Sunrise Academy',
  description: 'Sunrise Academy refund policy — how to request a refund.',
};

const SUPPORT = process.env.SUPPORT_EMAIL ?? 'sunriseacademy1122@gmail.com';

export default function RefundPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div className="mb-4">
        <Link href="/" className="text-xs text-muted hover:underline">
          ← Back to Home
        </Link>
      </div>
      <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Refund Policy
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
        Last updated: July 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Our Approach
          </h2>
          <p>
            Refunds are handled <strong style={{ color: 'var(--text-primary)' }}>manually, on a case-by-case basis</strong>.
            We do not have an automated refund system. Each request is reviewed individually and a
            decision is communicated within <strong style={{ color: 'var(--text-primary)' }}>5 business days</strong> of
            receiving your request.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            How to Request a Refund
          </h2>
          <p>Email us at{' '}
            <a href={`mailto:${SUPPORT}`} style={{ color: 'var(--brand-400)' }}>{SUPPORT}</a>{' '}
            with the subject line <em>&ldquo;Refund Request&rdquo;</em> and include:
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li>Your registered email address</li>
            <li>Transaction ID from your payment</li>
            <li>Reason for the refund request</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Eligibility
          </h2>
          <p>
            Refunds may be considered in circumstances such as duplicate payments or technical
            issues that prevented access. Refunds will generally <strong style={{ color: 'var(--text-primary)' }}>not</strong> be
            granted if access has been actively used or if the access was revoked due to a terms
            violation.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            Processing
          </h2>
          <p>
            Approved refunds are returned via the same payment method used for the original
            transaction (JazzCash, EasyPaisa, or Bank Transfer). Processing time after approval
            depends on your payment provider, typically 2–5 business days.
          </p>
        </section>

        <div className="alert-info">
          Questions about a refund? Contact{' '}
          <a href={`mailto:${SUPPORT}`} style={{ color: 'var(--brand-400)' }}>{SUPPORT}</a>.
          We aim to respond within 24 hours.
        </div>
      </div>
    </div>
  );
}
