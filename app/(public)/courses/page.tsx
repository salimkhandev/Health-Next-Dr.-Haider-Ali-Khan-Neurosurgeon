import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses — Sunrise Academy',
  description: 'Browse all courses available on Sunrise Academy.',
};

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  await connectDB();
  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();

  const coursesWithUrls = await Promise.all(
    courses.map(async (c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      price: c.price ?? 5000,
      videoCount: c.videos.length,
      totalDuration: c.videos.reduce((acc, v) => acc + v.duration, 0),
      thumbnailUrl: c.driveThumbnailUrl ? c.driveThumbnailUrl : (c.thumbnailKey ? await getPresignedGetUrl(c.thumbnailKey, 3600) : null),
    }))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
          All Courses
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {coursesWithUrls.length} course{coursesWithUrls.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {coursesWithUrls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          No courses available yet. Check back soon!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {coursesWithUrls.map((course) => (
            <article
              key={course.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {/* Thumbnail */}
              <div style={{ height: '180px', background: 'var(--surface-2)', overflow: 'hidden', position: 'relative' }}>
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem' }}>
                    🎓
                  </div>
                )}
                {/* Price badge */}
                <div style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'var(--brand-500)', color: '#fff',
                  borderRadius: '9999px', padding: '0.2rem 0.65rem',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  Rs. {course.price.toLocaleString()}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.25rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>{course.title}</h2>
                <p style={{
                  color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {course.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <span>📹 {course.videoCount} videos</span>
                  <span>⏱ {formatDuration(course.totalDuration)}</span>
                </div>

                {/* CTA — gated for visitors */}
                {isLoggedIn ? (
                  <Link
                    href={`/dashboard`}
                    className="btn-primary"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="btn-primary"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    🔒 Enroll to Watch
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
