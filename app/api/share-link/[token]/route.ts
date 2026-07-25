import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ShareLink from '@/lib/models/ShareLink';
import Patient from '@/lib/models/Patient';
import Visit from '@/lib/models/Visit';
import Settings from '@/lib/models/Settings';

// GET /api/share-link/[token] — Public endpoint for shared patient record
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  await connectDB();
  const { token } = await params;

  const shareLink = await ShareLink.findOne({ token }).lean();
  if (!shareLink) {
    return NextResponse.json({ error: 'Share link not found or invalid' }, { status: 404 });
  }

  if (shareLink.revoked) {
    return NextResponse.json({ error: 'This share link has been revoked by the doctor.' }, { status: 410 });
  }

  if (new Date() > new Date(shareLink.expiresAt)) {
    return NextResponse.json({ error: 'This share link has expired.' }, { status: 410 });
  }

  const patient = await Patient.findOne({ mrn: shareLink.mrn }).lean();
  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
  }

  // If specific visitId was shared, return only that visit; otherwise return all visits
  const visitFilter = shareLink.visitId
    ? { _id: shareLink.visitId }
    : { mrn: shareLink.mrn };

  const visits = await Visit.find(visitFilter).sort({ visitDate: -1 }).lean();
  const settings = await Settings.findOne().lean();

  return NextResponse.json({
    patient,
    visits,
    settings,
    expiresAt: shareLink.expiresAt,
  });
}
