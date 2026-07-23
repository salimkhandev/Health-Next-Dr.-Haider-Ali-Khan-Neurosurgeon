import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';
import mongoose from 'mongoose';

export async function GET(
  _req: Request,
  ctx: RouteContext<'/api/courses/[id]'>
) {
  const { id } = await ctx.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 });
  }

  await connectDB();

  const course = await Course.findById(id).lean();
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  const thumbnailUrl = course.thumbnailKey
    ? await getPresignedGetUrl(course.thumbnailKey, 3600)
    : null;

  // Return video metadata but NOT the r2Key — students see the player via /watch, not direct URLs
  const videos = course.videos
    .sort((a, b) => a.order - b.order)
    .map((v) => ({
      id: v._id.toString(),
      order: v.order,
      title: v.title,
      duration: v.duration,
      sizeBytes: v.sizeBytes,
    }));

  return NextResponse.json({
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    thumbnailUrl,
    videos,
    createdAt: course.createdAt,
  });
}
