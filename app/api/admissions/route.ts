import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admission from '@/lib/models/Admission';
import Bed from '@/lib/models/Bed';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/admissions — Admit a patient to a bed
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { mrn, wardId, bedId, admittingDiagnosis, attendingDoctor } = await req.json();

  if (!mrn || !wardId || !bedId) {
    return NextResponse.json({ error: 'mrn, wardId, and bedId are required' }, { status: 400 });
  }

  const patient = await Patient.findOne({ mrn });
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found. Check MRN.' }, { status: 404 });
  }

  // Check if patient is already admitted elsewhere
  const existingAdmission = await Admission.findOne({ mrn, status: 'Admitted' });
  if (existingAdmission) {
    return NextResponse.json(
      { error: `Patient is already admitted in a bed under admission ID ${existingAdmission._id}.` },
      { status: 409 }
    );
  }

  const bed = await Bed.findById(bedId);
  if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 });

  if (bed.status !== 'Available') {
    return NextResponse.json({ error: `Bed ${bed.bedNumber} is currently ${bed.status}.` }, { status: 400 });
  }

  const admission = await Admission.create({
    mrn,
    wardId,
    bedId,
    admissionDate: new Date(),
    admittingDiagnosis: admittingDiagnosis ?? '',
    attendingDoctor: attendingDoctor || 'Dr. Haider Ali Khan',
    status: 'Admitted',
  });

  // Mark bed as Occupied and assign currentAdmissionId
  bed.status = 'Occupied';
  bed.currentAdmissionId = admission._id;
  await bed.save();

  return NextResponse.json({ admission }, { status: 201 });
}

// GET /api/admissions — List active admissions
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') || 'Admitted') as 'Admitted' | 'Discharged';

  const admissions = await Admission.find({ status })
    .sort({ admissionDate: -1 })
    .populate('wardId', 'wardName')
    .populate('bedId', 'bedNumber')
    .lean();

  // Populate patient info
  const populated = await Promise.all(
    admissions.map(async (a) => {
      const patient = await Patient.findOne({ mrn: a.mrn }).lean();
      return {
        ...a,
        patient,
      };
    })
  );

  return NextResponse.json({ admissions: populated });
}
