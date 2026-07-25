import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Visit from '@/lib/models/Visit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/visits/[id] — update a visit (only if still within editableUntil)
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

  if (new Date() > visit.editableUntil) {
    return NextResponse.json({ error: 'Edit window closed — visits are read-only after the creation day.' }, { status: 403 });
  }

  const body = await req.json();
  // Prevent changing MRN or editableUntil
  delete body.mrn;
  delete body.editableUntil;

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
