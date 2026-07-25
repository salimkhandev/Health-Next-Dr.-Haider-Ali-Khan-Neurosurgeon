import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MedicineTestMaster from '@/lib/models/MedicineTestMaster';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/master-list?type=medicine|test&q=para
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'medicine' | 'test' | null (all)
  const q = searchParams.get('q') ?? '';

  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (q) filter.name = { $regex: q, $options: 'i' };

  const items = await MedicineTestMaster.find(filter).sort({ name: 1 }).limit(30).lean();
  return NextResponse.json({ items });
}

// POST /api/master-list — add a new item to master list
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { type, name, defaultDosage } = await req.json();

  if (!type || !name) {
    return NextResponse.json({ error: 'type and name are required' }, { status: 400 });
  }

  // Prevent duplicates
  const existing = await MedicineTestMaster.findOne({ type, name: { $regex: `^${name}$`, $options: 'i' } });
  if (existing) return NextResponse.json({ item: existing });

  const item = await MedicineTestMaster.create({ type, name: name.trim(), defaultDosage: defaultDosage ?? '' });
  return NextResponse.json({ item }, { status: 201 });
}

// DELETE /api/master-list?id=<_id>
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await MedicineTestMaster.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
