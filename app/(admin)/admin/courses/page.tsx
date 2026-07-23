'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CourseItem {
  id: string;
  title: string;
  description: string;
  thumbnailKey: string;
  videoCount: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchCourses() {
    try {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to load courses.');
      const data = await res.json();
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete course');
      fetchCourses();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="text-center py-10">Loading courses...</div>;
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 700 }}>Course Manager</h1>
          <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>Manage educational courses and videos</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Link
            href="/admin"
            style={{
              fontSize: '0.78rem', fontWeight: 500,
              padding: '0.4rem 0.85rem',
              borderRadius: '0.4rem',
              border: '1px solid var(--surface-2)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ← Verification Board
          </Link>
          <Link
            href="/admin/courses/new"
            style={{
              fontSize: '0.78rem', fontWeight: 600,
              padding: '0.4rem 0.85rem',
              borderRadius: '0.4rem',
              background: 'var(--brand-500)',
              color: '#fff',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            + Create Course
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-secondary mb-4">No courses created yet.</p>
          <Link href="/admin/courses/new" className="btn-primary text-sm px-4 py-2" style={{ textDecoration: 'none' }}>
            Create First Course
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {courses.map((c) => (
            <div key={c.id} className="card flex flex-col justify-between" style={{ padding: '1.25rem' }}>
              <div>
                <h3 className="font-semibold text-lg mb-1.5">{c.title}</h3>
                <p 
                  className="text-sm text-secondary mb-4" 
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {c.description}
                </p>
                <div className="text-xs text-muted mb-4">
                  📹 {c.videoCount} video{c.videoCount !== 1 ? 's' : ''} uploaded
                </div>
              </div>
              
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--surface-2)' }}>
                <Link 
                  href={`/admin/courses/${c.id}`} 
                  className="text-center text-sm font-semibold py-2 rounded hover:bg-surface-2"
                  style={{ flex: 1, color: 'var(--brand-400)', border: '1px solid var(--surface-2)', textDecoration: 'none' }}
                >
                  Edit / Videos
                </Link>
                <button 
                  onClick={() => handleDelete(c.id, c.title)}
                  className="text-center text-sm font-semibold py-2 rounded hover:bg-opacity-80"
                  style={{ flex: 1, color: '#fff', background: '#ef4444', border: 'none', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
