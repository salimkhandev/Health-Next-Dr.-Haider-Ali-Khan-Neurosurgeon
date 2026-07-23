import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';

export async function GET() {
  await connectDB();

  const courses = await Course.find({}, { title: 1, description: 1, thumbnailKey: 1, videos: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();

  // Generate fresh presigned thumbnail URLs — never store or cache these
  const data = await Promise.all(
    courses.map(async (c) => ({
      id: c._id.toString(),
      title: c.title,
      description: c.description,
      videoCount: c.videos.length,
      createdAt: c.createdAt,
      thumbnailUrl: c.thumbnailKey ? await getPresignedGetUrl(c.thumbnailKey, 3600) : null,
    }))
  );

  return NextResponse.json(data);
}
