import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Sunrise Academy',
  description: 'Sunrise Academy terms and conditions of use.',
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div className="mb-4">
        <Link href="/" className="text-xs text-muted hover:underline">
          ← Back to Home
        </Link>
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
        Terms &amp; Conditions
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
        Last updated: July 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            1. What You Purchase
          </h2>
          <p>
            Payment grants you personal, non-transferable access to Sunrise Academy course videos for a
            period of <strong style={{ color: 'var(--text-primary)' }}>one (1) year</strong> from
            the date your payment is approved. You are purchasing access to video content only — not
            a credential, certificate (unless earned by completion), or any other tangible product.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            2. Account & Access Rules
          </h2>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li>Your account is for your personal use only. Sharing login credentials is strictly prohibited.</li>
            <li>Recording, re-uploading, redistributing, or re-selling course content in any form is prohibited.</li>
            <li>Screen capture or use of third-party recording tools during video playback is a violation of these terms.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            3. Access Revocation
          </h2>
          <p>
            Sunrise Academy reserves the right to revoke access at any time if these terms are violated.
            Revocation does not entitle the user to a refund. See the Refund Policy for refund eligibility.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            4. Payment Verification
          </h2>
          <p>
            Access is only activated after manual verification of your payment screenshot by our
            team. Submitting false or manipulated screenshots is fraud and will result in permanent
            account suspension.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            5. Changes to Content
          </h2>
          <p>
            Sunrise Academy may add, modify, or remove course content at any time. We do not guarantee that
            specific videos will remain available for the full duration of your access period.
          </p>
        </section>

        <section>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
            6. Contact
          </h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a href={`mailto:${process.env.SUPPORT_EMAIL ?? 'sunriseacademy1122@gmail.com'}`}
              style={{ color: 'var(--brand-400)' }}>
              {process.env.SUPPORT_EMAIL ?? 'sunriseacademy1122@gmail.com'}
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
