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
  if (!contentType?.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 });
  }

  // Clean filename for safety
  const safeName = filename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'thumb.jpg';
  const timestamp = Date.now();
  const driveFileName = `${timestamp}-${safeName}`;
  
  try {
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://sunrise-english-language-and-skill.onrender.com';
    const { uploadUrl } = await createResumableUploadSession(
      driveFileName,
      contentType,
      DRIVE_FOLDERS.THUMBNAILS,
      origin
    );

    return NextResponse.json({ url: uploadUrl, isGoogleDrive: true });
  } catch (error: any) {
    console.error('Thumbnail upload session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 });
  }
}
