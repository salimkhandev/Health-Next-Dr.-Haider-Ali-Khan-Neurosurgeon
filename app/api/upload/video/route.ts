import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createResumableUploadSession, DRIVE_FOLDERS } from '@/lib/gdrive';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add rate limit check (Batch 10)

  const { contentType, filename } = (await req.json()) ?? {};
  if (!contentType?.startsWith('video/')) {
    return NextResponse.json({ error: 'Invalid file type. Must be a video.' }, { status: 400 });
  }

  // Clean filename for safety
  const safeName = filename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'video.mp4';
  const timestamp = Date.now();
  const driveFileName = `${timestamp}-${safeName}`;

  try {
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://sunrise-english-language-and-skill.onrender.com';
    const { uploadUrl } = await createResumableUploadSession(
      driveFileName,
      contentType,
      DRIVE_FOLDERS.VIDEOS,
      origin
    );

    // We still return 'key' as 'driveFileName' temporarily for backward compatibility in frontend component state if needed,
    // although we don't have the fileId yet because the upload hasn't finished.
    // Wait, the client doesn't need fileId upfront, it needs the url.
    // Actually, in the current R2 flow, the client submits the 'key' (which is the path) back to the backend when saving the course.
    // With Drive, the client uploads directly to the session URL. But how do we get the fileId?
    // The resumable upload response returns the completed file metadata, including `id`.
    // The client MUST return that `id` to the backend when saving the course.
    // So the client just needs the `uploadUrl`.
    return NextResponse.json({ url: uploadUrl, isGoogleDrive: true });
  } catch (error: any) {
    console.error('Video upload session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 });
  }
}
