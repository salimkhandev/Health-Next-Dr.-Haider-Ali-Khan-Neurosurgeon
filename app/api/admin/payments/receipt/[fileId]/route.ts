import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getDriveStreamResponse, getDriveFileMetadata } from '@/lib/gdrive';

export async function GET(
  req: NextRequest,
  ctx: any
) {
  const { fileId } = await ctx.params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token || token.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const driveRes = await getDriveStreamResponse(fileId, null);
    
    // We optionally get metadata to know the content type, but Drive API alt=media response
    // already has the correct content-type header usually.
    const metadata = await getDriveFileMetadata(fileId);

    return new NextResponse(driveRes.body, {
      status: 200,
      headers: {
        'Content-Type': metadata.mimeType || driveRes.headers.get('content-type') || 'application/octet-stream',
        // Cache control to avoid re-fetching on every scroll in admin panel
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Failed to stream receipt:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt.' }, { status: 500 });
  }
}
