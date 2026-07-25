import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Patient from '@/lib/models/Patient';
import Visit from '@/lib/models/Visit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/patients/[mrn]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mrn: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { mrn } = await params;

  const patient = await Patient.findOne({ mrn }).lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  const visits = await Visit.find({ mrn }).sort({ visitDate: -1 }).lean();

  return NextResponse.json({ patient, visits });
}

// PATCH /api/patients/[mrn] — update demographics
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ mrn: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { mrn } = await params;
  const body = await req.json();

  // Don't allow MRN change
  delete body.mrn;

  const patient = await Patient.findOneAndUpdate(
    { mrn },
    { $set: body },
    { new: true }
  ).lean();

  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  return NextResponse.json({ patient });
}
