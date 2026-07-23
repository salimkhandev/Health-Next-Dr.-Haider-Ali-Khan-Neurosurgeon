import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const users = await User.find({ role: 'student' })
    .populate('enrolledCourseIds', 'title')
    .sort({ createdAt: -1 })
    .lean();

  const formattedUsers = users.map(u => ({
    id: (u._id as any).toString(),
    name: u.name,
    email: u.email,
    status: u.status,
    // Filter nulls: a course ObjectId may have no matching Course doc (deleted course)
    enrolledCourses: (u.enrolledCourseIds as any[] ?? []).filter(Boolean).map((c: any) => ({
      id: (c._id || c).toString(),
      title: c.title ?? '(deleted course)',
    })),
    // Explicitly convert Dates → ISO strings so JSON.parse gives consistent types
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    accessExpiresAt: u.accessExpiresAt instanceof Date
      ? u.accessExpiresAt.toISOString()
      : (u.accessExpiresAt ?? null),
  }));

  return NextResponse.json(formattedUsers);
}
