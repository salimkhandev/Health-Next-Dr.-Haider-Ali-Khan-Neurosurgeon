import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Ward from '@/lib/models/Ward';
import Bed from '@/lib/models/Bed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/wards — List all wards with real-time bed statistics
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const wards = await Ward.find().sort({ wardName: 1 }).lean();

  const wardStats = await Promise.all(
    wards.map(async (w) => {
      const beds = await Bed.find({ wardId: w._id }).lean();
      const occupiedCount = beds.filter((b) => b.status === 'Occupied').length;
      const availableCount = beds.filter((b) => b.status === 'Available').length;
      const maintenanceCount = beds.filter((b) => b.status === 'Under Maintenance').length;

      return {
        ...w,
        totalBeds: beds.length,
        occupiedCount,
        availableCount,
        maintenanceCount,
        occupancyRate: beds.length > 0 ? Math.round((occupiedCount / beds.length) * 100) : 0,
      };
    })
  );

  return NextResponse.json({ wards: wardStats });
}

// POST /api/wards — Create a new ward & automatically generate beds
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { wardName, bedCapacity = 10 } = await req.json();

  if (!wardName) {
    return NextResponse.json({ error: 'wardName is required' }, { status: 400 });
  }

  const existing = await Ward.findOne({ wardName: { $regex: `^${wardName.trim()}$`, $options: 'i' } });
  if (existing) {
    return NextResponse.json({ error: 'A ward with this name already exists.' }, { status: 409 });
  }

  const ward = await Ward.create({
    wardName: wardName.trim(),
    bedCapacity: Number(bedCapacity),
  });

  // Create beds for this ward automatically
  const bedPromises = [];
  const prefix = ward.wardName.replace(/\s+/g, '');
  for (let i = 1; i <= Number(bedCapacity); i++) {
    const bedNumber = `${prefix}-${String(i).padStart(2, '0')}`;
    bedPromises.push(
      Bed.create({
        wardId: ward._id,
        bedNumber,
        status: 'Available',
      })
    );
  }

  await Promise.all(bedPromises);

  return NextResponse.json({ ward }, { status: 201 });
}
