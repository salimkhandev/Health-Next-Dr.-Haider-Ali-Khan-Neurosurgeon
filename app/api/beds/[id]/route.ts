import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Bed from '@/lib/models/Bed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH /api/beds/[id] — Update bed status (e.g. Available <-> Under Maintenance)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const { status } = await req.json();

  if (!['Available', 'Occupied', 'Under Maintenance'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  const bed = await Bed.findById(id);
  if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 });

  if (bed.status === 'Occupied' && status !== 'Occupied') {
    return NextResponse.json(
      { error: 'Cannot change status of an occupied bed directly. Discharge the patient first.' },
      { status: 400 }
    );
  }

  bed.status = status;
  await bed.save();

  return NextResponse.json({ bed });
}
