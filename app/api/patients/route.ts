import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Patient from '@/lib/models/Patient';
import { generateMRN } from '@/lib/mrn';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/patients?q=search&page=1&limit=20
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

  const filter = q
    ? {
        $or: [
          { mrn: { $regex: q, $options: 'i' } },
          { fullName: { $regex: q, $options: 'i' } },
          { contact: { $regex: q, $options: 'i' } },
        ],
      }
    : {};

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return NextResponse.json({ patients, total, page, limit });
}

// POST /api/patients — register new patient
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { fullName, age, dob, gender, contact, address, bloodGroup, allergies, chronicConditions } = body;

  if (!fullName || !age || !gender || !contact) {
    return NextResponse.json({ error: 'fullName, age, gender, and contact are required.' }, { status: 400 });
  }

  // Duplicate check by contact
  const existing = await Patient.findOne({ contact: contact.trim() });
  if (existing) {
    return NextResponse.json(
      { error: 'A patient with this contact number already exists.', existing },
      { status: 409 }
    );
  }

  const mrn = await generateMRN();

  const patient = await Patient.create({
    mrn,
    fullName: fullName.trim(),
    age,
    dob: dob ? new Date(dob) : undefined,
    gender,
    contact: contact.trim(),
    address: address ?? '',
    bloodGroup: bloodGroup ?? '',
    allergies: allergies ?? [],
    chronicConditions: chronicConditions ?? [],
    visitCount: 0,
  });

  return NextResponse.json({ patient }, { status: 201 });
}
