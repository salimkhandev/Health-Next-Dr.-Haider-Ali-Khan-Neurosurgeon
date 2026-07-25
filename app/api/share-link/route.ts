import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import ShareLink from '@/lib/models/ShareLink';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/share-link — Generate an expiring read-only public share link
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { mrn, visitId, hoursValid = 48 } = await req.json();

  if (!mrn) {
    return NextResponse.json({ error: 'mrn is required' }, { status: 400 });
  }

  // Generate 16-character secure random token
  const token = crypto.randomBytes(8).toString('hex');
  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);

  const shareLink = await ShareLink.create({
    mrn,
    visitId: visitId || null,
    token,
    expiresAt,
    revoked: false,
  });

  return NextResponse.json({
    token: shareLink.token,
    expiresAt: shareLink.expiresAt,
    shareUrl: `/share/${shareLink.token}`,
  });
}

// DELETE /api/share-link?token=... — Revoke share link
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

  await ShareLink.findOneAndUpdate({ token }, { $set: { revoked: true } });
  return NextResponse.json({ ok: true });
}
