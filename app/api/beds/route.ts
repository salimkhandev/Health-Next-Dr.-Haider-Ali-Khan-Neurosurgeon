import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Bed from '@/lib/models/Bed';
import Admission from '@/lib/models/Admission';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/beds?wardId=... — Fetch beds in a ward with populated admission & patient info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const wardId = new URL(req.url).searchParams.get('wardId');

  const filter = wardId ? { wardId } : {};
  const beds = await Bed.find(filter).sort({ bedNumber: 1 }).lean();

  // Populate admission & patient details for occupied beds
  const populatedBeds = await Promise.all(
    beds.map(async (b) => {
      if (b.currentAdmissionId) {
        const admission = await Admission.findById(b.currentAdmissionId).lean();
        if (admission) {
          const patient = await Patient.findOne({ mrn: admission.mrn }).lean();
          return {
            ...b,
            admission,
            patient,
          };
        }
      }
      return b;
    })
  );

  return NextResponse.json({ beds: populatedBeds });
}
