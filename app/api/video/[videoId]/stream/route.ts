import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getDriveStreamResponse } from '@/lib/gdrive';

export async function GET(
  req: NextRequest,
  ctx: any
) {
  const { videoId } = await ctx.params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Access check: paid AND not expired
  if (token.role !== 'admin') {
    if (token.status !== 'paid') {
      return NextResponse.json({ error: 'Payment required.' }, { status: 403 });
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

  if (!video.driveFileId) {
    return NextResponse.json({ error: 'Video file missing.' }, { status: 404 });
  }

  const range = req.headers.get('range');

  try {
    // native fetch → Drive REST API; response.body is already a Web ReadableStream,
    // no Node.js stream conversion needed, bytes flow to the browser as they arrive.
    const driveRes = await getDriveStreamResponse(video.driveFileId, range);

    const responseHeaders: Record<string, string> = {
      'Accept-Ranges': 'bytes',
      'Content-Type': driveRes.headers.get('content-type') || 'video/mp4',
      // Override Drive's 'attachment' — browsers block inline playback otherwise
      'Content-Disposition': 'inline',
    };

    const contentLength = driveRes.headers.get('content-length');
    const contentRange = driveRes.headers.get('content-range');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    return new NextResponse(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Drive stream error:', error);
    return NextResponse.json({ error: 'Failed to stream video.' }, { status: 500 });
  }
}
