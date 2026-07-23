'use client';

import { useState, useEffect } from 'react';
import { safeJson } from '@/lib/safeJson';

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  enrolledCourses: { id: string; title: string }[];
  createdAt: string;
  accessExpiresAt: string | null;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid:     { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a' },
  revoked:  { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
  rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626' },
  pending:  { bg: 'var(--surface-2)',       color: 'var(--text-secondary)' },
  expired:  { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/students')
      .then(async (res) => {
        // Read body once, then branch on success/failure
        const data = await safeJson<Student[] | { error: string }>(res);
        if (!res.ok || !Array.isArray(data)) {
          throw new Error((data as { error?: string }).error ?? `Server error (${res.status})`);
        }
        setStudents(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRevoke(studentId: string) {
    if (!confirm("Are you sure you want to revoke this student's access?")) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}/revoke`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to revoke access');
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'revoked' } : s));
    } catch (err: any) {
      alert(err.message);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 700 }}>
          Student Management
        </h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
          No students registered yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {students.map(s => {
            const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.pending;
            return (
              <div key={s.id} className="card" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
                {/* Top row: name + badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem', wordBreak: 'break-all' }}>
                      {s.email}
                    </div>
                  </div>
                  <span style={{
                    background: st.bg, color: st.color,
                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                    padding: '0.2rem 0.6rem', borderRadius: '9999px',
                    whiteSpace: 'nowrap', textTransform: 'uppercase', flexShrink: 0,
                  }}>
                    {s.status}
                  </span>
                </div>

                {/* Info row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.35rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>COURSES</span><br />
                    {s.enrolledCourses.length > 0
                      ? s.enrolledCourses.map(c => c.title).join(', ')
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>EXPIRES</span><br />
                    {s.accessExpiresAt ? new Date(s.accessExpiresAt).toLocaleDateString() : '—'}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>JOINED</span><br />
                    {new Date(s.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                {s.status === 'paid' && (
                  <button
                    onClick={() => handleRevoke(s.id)}
                    style={{
                      fontSize: '0.78rem', fontWeight: 600,
                      padding: '0.4rem 0.85rem',
                      borderRadius: '0.4rem',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#dc2626',
                      border: '1px solid rgba(239,68,68,0.25)',
                      cursor: 'pointer',
                    }}
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
