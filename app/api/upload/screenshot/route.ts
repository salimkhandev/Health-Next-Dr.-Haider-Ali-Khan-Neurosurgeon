import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createResumableUploadSession, DRIVE_FOLDERS } from '@/lib/gdrive';

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only allow if student is pending or rejected (needs to submit payment)
  if (token.role === 'student' && !['pending', 'rejected'].includes(token.status as string)) {
    return NextResponse.json({ error: 'Not eligible to submit payment.' }, { status: 403 });
  }

  // TODO: Add rate limit check (Batch 10)

  const { contentType } = (await req.json()) ?? {};
  if (!contentType?.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type. Must be an image.' }, { status: 400 });
  }

  const timestamp = Date.now();
  const driveFileName = `${token.id}-${timestamp}.jpg`;
  
  try {
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://sunrise-english-language-and-skill.onrender.com';
    const { uploadUrl } = await createResumableUploadSession(
      driveFileName,
      contentType,
      DRIVE_FOLDERS.RECEIPTS,
      origin
    );

    return NextResponse.json({ url: uploadUrl, isGoogleDrive: true });
  } catch (error: any) {
    console.error('Screenshot upload session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 });
  }
}
