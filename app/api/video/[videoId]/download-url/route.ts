import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/video/[videoId]/download-url'>
) {
  const { videoId } = await ctx.params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Access check per §11: paid AND not expired
  if (token.role !== 'admin') {
    if (token.status !== 'paid') {
      return NextResponse.json({ error: 'Payment required to download this video.' }, { status: 403 });
    }
    if (token.accessExpiresAt && new Date(token.accessExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'Access expired.' }, { status: 403 });
    }
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return NextResponse.json({ error: 'Invalid video ID.' }, { status: 400 });
  }

  await connectDB();

  const course = await Course.findOne(
    { 'videos._id': videoId },
    { 'videos.$': 1 }
  ).lean();

  if (!course || !course.videos || course.videos.length === 0) {
    return NextResponse.json({ error: 'Video not found.' }, { status: 404 });
  }

  const video = course.videos[0];

  if (video.driveFileId) {
    // With Google Drive proxying, the local URL acts as the download URL.
    return NextResponse.json({ url: `/api/video/${videoId}/stream` });
  }

  if (video.r2Key) {
    // 6 hours expiry for OPFS download per §11
    const url = await getPresignedGetUrl(video.r2Key, 21600);
    return NextResponse.json({ url });
  }

  return NextResponse.json({ error: 'Video file missing.' }, { status: 404 });
}
