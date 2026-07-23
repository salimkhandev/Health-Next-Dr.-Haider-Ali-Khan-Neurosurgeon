import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import Progress from '@/lib/models/Progress';

type Props = { params: Promise<{ courseId: string }> };

export const dynamic = 'force-dynamic';

export default async function CertificatePage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { courseId } = await params;

  await connectDB();

  const course = await Course.findById(courseId).lean();
  if (!course) notFound();

  // Validate completion
  const allVideos = course.videos;
  const completedProgress = await Progress.find({
    userId: session.user.id,
    courseId,
    completed: true,
  }).lean();

  const isCourseComplete =
    allVideos.length > 0 &&
    allVideos.every((v) =>
      completedProgress.some((p) => p.videoId.toString() === v._id.toString())
    );

  if (!isCourseComplete) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: 'var(--text-secondary)' }}>
        <h1 className="text-xl font-bold mb-2">Certificate Not Generated Yet</h1>
        <p className="text-sm">You must watch all videos in the course to unlock the certificate.</p>
      </div>
    );
  }

  // Find completion date (latest completed progress timestamp)
  const completionDates = completedProgress.map((p) => new Date(p.updatedAt).getTime());
  const maxDate = completionDates.length > 0 ? new Date(Math.max(...completionDates)) : new Date();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header, footer, .no-print {
            display: none !important;
          }
          .cert-container {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 2cm !important;
            width: 100% !important;
            height: 100% !important;
            page-break-inside: avoid;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}} />

      <div className="no-print" style={{ maxWidth: '800px', margin: '2rem auto 0 auto', padding: '0 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/dashboard" className="text-xs text-muted hover:underline" style={{ color: 'var(--text-secondary)' }}>
          ← Back to Dashboard
        </Link>
        <button 
          onClick={() => window.print()} 
          className="btn-primary text-xs px-4 py-2"
          style={{ width: 'auto' }}
        >
          🖨 Print / Save PDF
        </button>
      </div>

      <div 
        className="cert-container"
        style={{
          maxWidth: '800px',
          margin: '2rem auto',
          background: '#1e293b',
          border: '8px double var(--brand-500)',
          borderRadius: '0.75rem',
          padding: '4rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          color: '#f8fafc',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', fontSize: '1.5rem' }}>
          🎓
        </div>

        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--brand-400)', fontWeight: 600 }}>
          Certificate of Completion
        </span>

        <h2 style={{ fontSize: '1.75rem', color: '#fff', margin: '1.5rem 0 0.5rem 0', fontFamily: 'serif' }}>
          This is to certify that
        </h2>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-500)', margin: '1rem 0' }}>
          {session.user.name}
        </h1>

        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '560px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
          has successfully completed the curriculum and all video instruction modules for the professional course
        </p>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', marginBottom: '3rem' }}>
          {course.title}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Date of Issue</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{maxDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Authorized by</span>
            <span style={{ fontSize: '1.1rem', fontFamily: 'serif', fontWeight: 600, color: 'var(--brand-500)' }}>Sunrise Academy Authority</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Inline Link wrapper just to avoid Next.js compile issue if Link isn't imported
import Link from 'next/link';
