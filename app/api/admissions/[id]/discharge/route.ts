import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Admission from '@/lib/models/Admission';
import Bed from '@/lib/models/Bed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/admissions/[id]/discharge — Discharge a patient from a bed
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const { dischargeNotes } = await req.json();

  const admission = await Admission.findById(id);
  if (!admission) return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });

  if (admission.status === 'Discharged') {
    return NextResponse.json({ error: 'Patient has already been discharged.' }, { status: 400 });
  }

  // Update admission record
  admission.status = 'Discharged';
  admission.dischargeDate = new Date();
  admission.dischargeNotes = dischargeNotes ?? '';
  await admission.save();

  // Revert bed to Available and clear admission ID
  const bed = await Bed.findById(admission.bedId);
  if (bed) {
    bed.status = 'Available';
    bed.currentAdmissionId = null;
    await bed.save();
  }

  return NextResponse.json({ admission, ok: true });
}
