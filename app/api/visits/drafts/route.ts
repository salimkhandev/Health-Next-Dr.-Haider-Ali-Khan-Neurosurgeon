import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/visits/drafts — all pending (draft) visits, enriched with patient name
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized — please log in again.' }, { status: 401 });
    }

    await connectDB();

    // Also catch visits where status is missing/null (saved before schema had the field)
    const drafts = await Visit.find({
      $or: [{ status: 'draft' }, { status: { $exists: false } }, { status: null }],
    })
      .sort({ visitDate: -1 })
      .lean();

    // Attach patient name for display
    const mrns = [...new Set(drafts.map((d) => d.mrn))];
    const patients = mrns.length > 0
      ? await Patient.find({ mrn: { $in: mrns } }, { mrn: 1, fullName: 1 }).lean()
      : [];

    const patientMap: Record<string, string> = {};
    patients.forEach((p) => { patientMap[p.mrn] = p.fullName; });

    const enriched = drafts.map((d) => ({
      ...d,
      patientName: patientMap[d.mrn] ?? 'Unknown',
    }));

    return NextResponse.json({ drafts: enriched, count: enriched.length });
  } catch (e) {
    console.error('[GET /api/visits/drafts]', e);
    return NextResponse.json(
      { error: 'Server error while loading drafts.' },
      { status: 500 }
    );
  }
}
