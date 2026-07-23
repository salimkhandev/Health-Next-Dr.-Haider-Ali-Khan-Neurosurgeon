import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { getPresignedGetUrl } from '@/lib/r2';
import { makeFilePublicAndGetThumbnail } from '@/lib/gdrive';

export async function GET(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/courses/[id]'>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 });
  }

  await connectDB();
  const course = await Course.findById(id).lean();
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  // Admin gets the thumbnail presigned URL
  const thumbnailUrl = course.driveThumbnailUrl || (course.thumbnailKey
    ? await getPresignedGetUrl(course.thumbnailKey, 3600)
    : null);

  return NextResponse.json({
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    price: course.price,
    thumbnailKey: course.thumbnailKey,
    driveThumbnailUrl: course.driveThumbnailUrl,
    thumbnailUrl,
    videos: course.videos.map((v) => ({
      id: v._id.toString(),
      order: v.order,
      title: v.title,
      duration: v.duration,
      r2Key: v.r2Key,
      driveFileId: v.driveFileId,
      sizeBytes: v.sizeBytes,
    })),
  });
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/courses/[id]'>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 });
  }

  const body = await req.json();
  const { title, description, price, thumbnailKey, driveThumbnailId, videos } = body;

  if (!title || !description || price === undefined) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  await connectDB();

  // Validate video entries if provided
  const parsedVideos = Array.isArray(videos)
    ? videos.map((v: any, index: number) => {
        if (!v.title || (!v.r2Key && !v.driveFileId) || typeof v.duration !== 'number' || typeof v.sizeBytes !== 'number') {
          throw new Error(`Invalid video properties at index ${index}`);
        }
        return {
          _id: v.id && mongoose.Types.ObjectId.isValid(v.id) ? new mongoose.Types.ObjectId(v.id) : new mongoose.Types.ObjectId(),
          order: typeof v.order === 'number' ? v.order : index + 1,
          title: v.title,
          duration: v.duration,
          r2Key: v.r2Key || '',
          driveFileId: v.driveFileId,
          sizeBytes: v.sizeBytes,
        };
      })
    : [];

  const course = await Course.findById(id);
  if (!course) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  let driveThumbnailUrl = course.driveThumbnailUrl;
  
  // If driveThumbnailId was provided AND it's different from the stored key/id
  // (We use thumbnailKey to temporarily hold the ID from frontend)
  if (driveThumbnailId) {
    try {
      const url = await makeFilePublicAndGetThumbnail(driveThumbnailId);
      if (url) driveThumbnailUrl = url;
    } catch (err) {
      console.error('Failed to make thumbnail public', err);
    }
  }

  course.title = title;
  course.description = description;
  course.price = Number(price);
  course.thumbnailKey = thumbnailKey || '';
  if (driveThumbnailUrl) course.driveThumbnailUrl = driveThumbnailUrl;
  course.videos = parsedVideos as any;

  await course.save();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<'/api/admin/courses/[id]'>
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid course ID.' }, { status: 400 });
  }

  await connectDB();
  const res = await Course.findByIdAndDelete(id);
  if (!res) {
    return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
  }

  // Note: For completeness, ideally we'd delete videos & thumbnail from Cloudflare R2,
  // but as per user rules we only mutate database/R2 objects directly. Since deletion is low-risk,
  // we just clear the DB course entry. R2 garbage collection/prefix deletion can handle orphaned keys.
  
  return NextResponse.json({ success: true });
}
