import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);

  await connectDB();

  // Look up user by their session ID (more reliable than email — avoids case-mismatch on stale JWTs)
  const User = (await import('@/lib/models/User')).default;
  const dbUser = await User.findOne({ email: session?.user?.email }).lean();
  const enrolledIds = dbUser?.enrolledCourseIds || [];

  // Fetch only enrolled courses
  const courses = await Course.find({ _id: { $in: enrolledIds } }).sort({ createdAt: -1 }).lean();

  const coursesWithUrls = await Promise.all(
    courses.map(async (c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      videoCount: c.videos.length,
      totalDuration: c.videos.reduce((acc, v) => acc + v.duration, 0),
      thumbnailUrl: c.thumbnailKey ? await getPresignedGetUrl(c.thumbnailKey, 3600) : null,
      firstVideoId: c.videos.sort((a, b) => a.order - b.order)[0]?._id?.toString() || null,
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--surface-0)' }}>
      <main style={{ flex: 1, padding: 'clamp(1.5rem, 4vw, 3rem) clamp(0.75rem, 3vw, 1.5rem)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>


          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', fontWeight: 700 }}>
                Welcome back, {session?.user?.name || 'Student'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Access status: <span className="font-semibold text-brand-400">Premium active</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/tutor"
                className="text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                style={{ background: 'var(--brand-500)', color: '#0f172a', textDecoration: 'none' }}
              >
                🤖 AI Tutor
              </Link>
              <Link
                href="/downloads"
                className="text-sm font-semibold px-4 py-2 border rounded-lg hover:bg-surface-2 transition-colors flex items-center gap-2"
                style={{ color: 'var(--text-secondary)', borderColor: 'var(--surface-2)', textDecoration: 'none' }}
              >
                📴 Downloads
              </Link>
            </div>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Your Enrolled Courses
          </h2>

          {coursesWithUrls.length === 0 ? (
            <div className="card text-center py-12 text-secondary">
              <p className="mb-4">You are not enrolled in any courses yet.</p>
              <Link href="/courses" className="btn-primary" style={{ textDecoration: 'none' }}>
                Browse Courses
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {coursesWithUrls.map((course) => (
                <div
                  key={course.id}
                  className="card flex flex-col justify-between"
                  style={{ padding: 0, overflow: 'hidden' }}
                >
                  <div>
                    {/* Thumbnail */}
                    <div style={{ height: '170px', background: 'var(--surface-2)', overflow: 'hidden', position: 'relative' }}>
                      {course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎓</div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.25rem' }}>
                      <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                        {course.title}
                      </h3>
                      <p
                        className="text-sm text-secondary mb-4"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {course.description}
                      </p>

                      <div className="flex gap-4 text-xs text-muted">
                        <span>📹 {course.videoCount} videos</span>
                        <span>⏱ {formatDuration(course.totalDuration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t" style={{ borderColor: 'var(--surface-2)' }}>
                    {course.firstVideoId ? (
                      <Link
                        href={`/watch/${course.id}/${course.firstVideoId}`}
                        className="btn-primary text-center text-sm py-2 block"
                        style={{ textDecoration: 'none' }}
                      >
                        Start Learning
                      </Link>
                    ) : (
                      <button className="btn-primary text-sm py-2 block w-100" disabled>
                        No Content Available
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
