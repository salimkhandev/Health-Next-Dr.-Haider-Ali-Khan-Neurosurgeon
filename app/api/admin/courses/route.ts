import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/db';
import Course from '@/lib/models/Course';
import { makeFilePublicAndGetThumbnail } from '@/lib/gdrive';

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const courses = await Course.find({}).sort({ createdAt: -1 }).lean();
  
  const mapped = courses.map((c) => ({
    id: c._id.toString(),
    title: c.title,
    description: c.description,
    price: c.price,
    thumbnailKey: c.thumbnailKey,
    videoCount: c.videos.length,
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, description, price, thumbnailKey, driveThumbnailId } = await req.json();
  if (!title || !description || price === undefined || (!thumbnailKey && !driveThumbnailId)) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  await connectDB();

  let driveThumbnailUrl = undefined;
  if (driveThumbnailId) {
    try {
      const url = await makeFilePublicAndGetThumbnail(driveThumbnailId);
      if (url) driveThumbnailUrl = url;
    } catch (err) {
      console.error('Failed to make thumbnail public', err);
    }
  }

  const course = await Course.create({
    title,
    description,
    price: Number(price),
    thumbnailKey: thumbnailKey || '',
    driveThumbnailUrl,
    videos: [],
  });

  return NextResponse.json({ id: course._id.toString() });
}
