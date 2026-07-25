import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import Patient from '@/lib/models/Patient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/visits/[id] — update a visit
// Draft visits: always editable until completed
// Complete visits: locked after the creation day (editableUntil)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const visit = await Visit.findById(id);
  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });

  // Only enforce the time-lock on already-completed visits
  if (visit.status === 'complete' && new Date() > visit.editableUntil) {
    return NextResponse.json(
      { error: 'Edit window closed — completed visits are read-only after the creation day.' },
      { status: 403 }
    );
  }

  const body = await req.json();
  // Prevent changing MRN or editableUntil directly
  delete body.mrn;
  delete body.editableUntil;

  // If completing a draft, set editableUntil to end of today and increment visitCount
  const isCompleting = visit.status === 'draft' && body.status === 'complete';
  if (isCompleting) {
    const now = new Date();
    body.editableUntil = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    await Patient.findOneAndUpdate({ mrn: visit.mrn }, { $inc: { visitCount: 1 } });
  }

  const updated = await Visit.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  return NextResponse.json({ visit: updated });
}

// GET /api/visits/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();
  const visit = await Visit.findById(id).lean();
  if (!visit) return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
  return NextResponse.json({ visit });
}
