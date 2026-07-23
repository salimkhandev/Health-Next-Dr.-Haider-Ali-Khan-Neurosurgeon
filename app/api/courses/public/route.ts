import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';

// Public endpoint — no auth required — returns basic course info for enrollment
export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();

  const data = await Promise.all(
    courses.map(async (c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      price: c.price ?? 5000,
      videoCount: c.videos.length,
      thumbnailUrl: c.driveThumbnailUrl ? c.driveThumbnailUrl : (c.thumbnailKey ? await getPresignedGetUrl(c.thumbnailKey, 3600) : null),
    }))
  );

  return NextResponse.json(data);
}
