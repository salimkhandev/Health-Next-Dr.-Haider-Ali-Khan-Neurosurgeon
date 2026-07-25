import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/visits/drafts — all pending (draft) visits, enriched with patient name
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const drafts = await Visit.find({ status: 'draft' })
    .sort({ visitDate: -1 })
    .lean();

  // Attach patient name for display
  const mrns = [...new Set(drafts.map((d) => d.mrn))];
  const patients = await Patient.find({ mrn: { $in: mrns } }, { mrn: 1, fullName: 1 }).lean();
  const patientMap: Record<string, string> = {};
  patients.forEach((p) => { patientMap[p.mrn] = p.fullName; });

  const enriched = drafts.map((d) => ({
    ...d,
    patientName: patientMap[d.mrn] ?? 'Unknown',
  }));

  return NextResponse.json({ drafts: enriched, count: enriched.length });
}
