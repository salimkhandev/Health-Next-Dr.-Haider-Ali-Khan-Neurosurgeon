import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/visits — create new visit and increment patient visit count
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { mrn, symptoms, confirmedDiagnosis, testsPrescribed, medicinesPrescribed,
    doctorNotes, vitals, aiConversation, aiSuggestions, nextFollowUpDate } = body;

  if (!mrn) return NextResponse.json({ error: 'mrn is required' }, { status: 400 });

  const patient = await Patient.findOne({ mrn });
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  // Edit window: same calendar day (midnight end of today)
  const now = new Date();
  const editableUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const visit = await Visit.create({
    mrn,
    visitDate: now,
    symptoms: symptoms ?? [],
    confirmedDiagnosis: confirmedDiagnosis ?? '',
    testsPrescribed: testsPrescribed ?? [],
    medicinesPrescribed: medicinesPrescribed ?? [],
    doctorNotes: doctorNotes ?? '',
    vitals: vitals ?? {},
    aiConversation: aiConversation ?? [],
    aiSuggestions: aiSuggestions ?? {},
    nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
    editableUntil,
  });

  // Increment visit count on patient
  await Patient.findOneAndUpdate({ mrn }, { $inc: { visitCount: 1 } });

  return NextResponse.json({ visit }, { status: 201 });
}

// GET /api/visits?mrn=NC-2026-0001 — visits for a patient
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const mrn = new URL(req.url).searchParams.get('mrn');
  if (!mrn) return NextResponse.json({ error: 'mrn required' }, { status: 400 });

  const visits = await Visit.find({ mrn }).sort({ visitDate: -1 }).lean();
  return NextResponse.json({ visits });
}
