import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/video/[videoId]'>
) {
  const { videoId } = await ctx.params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Access check per §10: paid AND not expired
  if (token.role !== 'admin') {
    if (token.status !== 'paid') {
      return NextResponse.json({ error: 'Payment required to stream this video.' }, { status: 403 });
    }
    if (token.accessExpiresAt && new Date(token.accessExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Access expired.' }, { status: 403 });
    }
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID.' }, { status: 400 });
  }

  await connectDB();

  // Find the course that contains this video
  const course = await Course.findOne(
    { 'videos._id': videoId },
    { 'videos.$': 1 }
  ).lean();

  if (!course || !course.videos || course.videos.length === 0) {
    return NextResponse.json({ error: 'Video not found.' }, { status: 404 });
  }

  const video = course.videos[0];

  // If we still have an r2Key and no driveFileId (backward compatibility)
  if (!video.driveFileId && video.r2Key) {
    const url = await getPresignedGetUrl(video.r2Key, 7200);
    return NextResponse.json({ url });
  }

  if (!video.driveFileId) {
    return NextResponse.json({ error: 'Video file missing.' }, { status: 404 });
  }

  return NextResponse.json({ url: `/api/video/${videoId}/stream` });
}
