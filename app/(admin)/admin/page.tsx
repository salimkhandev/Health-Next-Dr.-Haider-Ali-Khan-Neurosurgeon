'use client';

import { useEffect, useState } from 'react';
import { safeJson } from '@/lib/safeJson';
import Link from 'next/link';

interface PaymentItem {
  id: string;
  name: string;
  email: string;
  paymentMethod: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  screenshotUrl: string | null;
  adminNote?: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef6868' },
  pending:  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
};

export default function AdminDashboard() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  async function fetchPayments() {
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to load payments.');
      setPayments(await safeJson(res));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPayments(); }, []);

  async function handleReview(paymentId: string, status: 'approved' | 'rejected') {
    setProcessing(prev => ({ ...prev, [paymentId]: true }));
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status, adminNote: notes[paymentId] || '' }),
      });
      if (!res.ok) {
        let msg = 'Failed to update payment status';
        try { const d = JSON.parse(await res.text()); if (d.error) msg = d.error; } catch {}
        throw new Error(msg);
      }
      await fetchPayments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessing(prev => ({ ...prev, [paymentId]: false }));
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span className="spinner" />
    </div>
  );
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 700 }}>
          Payment Approvals
        </h1>
        <Link
          href="/admin/courses"
          className="btn-primary"
          style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
        >
          📚 Manage Courses
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="text-secondary">No payment submissions found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {payments.map((p) => {
            const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
            return (
              <div key={p.id} className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                {/* Name + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', wordBreak: 'break-all' }}>{p.email}</div>
                  </div>
                  <span style={{
                    background: st.bg, color: st.color,
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                    padding: '0.25rem 0.65rem', borderRadius: '9999px',
                    whiteSpace: 'nowrap', textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {p.status}
                  </span>
                </div>

                {/* Two-column grid on md+, single col on mobile */}
                <div className="payment-card-grid">
                  {/* Details column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div><strong>Method:</strong> {p.paymentMethod}</div>
                    <div><strong>Amount:</strong> Rs. {p.amount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(p.submittedAt).toLocaleString()}
                    </div>

                    {/* Admin note display */}
                    {p.status !== 'pending' && p.adminNote && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', background: 'var(--surface-2)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong>Admin Note:</strong> {p.adminNote}
                      </div>
                    )}

                    {/* Approve / Reject actions */}
                    {p.status === 'pending' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                          className="input"
                          style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                          placeholder="Admin note (optional)"
                          value={notes[p.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-primary"
                            style={{ flex: 1, background: '#22c55e', color: '#0f172a', fontSize: '0.85rem', padding: '0.55rem' }}
                            onClick={() => handleReview(p.id, 'approved')}
                            disabled={processing[p.id]}
                          >
                            {processing[p.id] ? '...' : '✓ Approve'}
                          </button>
                          <button
                            className="btn-primary"
                            style={{ flex: 1, background: '#ef4444', color: '#fff', fontSize: '0.85rem', padding: '0.55rem' }}
                            onClick={() => handleReview(p.id, 'rejected')}
                            disabled={processing[p.id]}
                          >
                            {processing[p.id] ? '...' : '✕ Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Screenshot column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Uploaded Screenshot:</span>
                    {p.screenshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.screenshotUrl}
                        alt="Payment screenshot"
                        style={{
                          width: '100%',
                          maxHeight: '260px',
                          objectFit: 'contain',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--surface-2)',
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '1rem', background: 'var(--surface-2)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        No screenshot
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .payment-card-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        @media (min-width: 600px) {
          .payment-card-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
