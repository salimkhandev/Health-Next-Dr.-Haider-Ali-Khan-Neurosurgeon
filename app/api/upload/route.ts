import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/upload — handles file attachments (MRI scans, lab reports, etc.)
// Saves to /public/uploads/<mrn>/ and returns the public URL
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const mrn = formData.get('mrn') as string | null;
  const label = (formData.get('label') as string | null) ?? 'Document';

  if (!file || !mrn) {
    return NextResponse.json({ error: 'file and mrn are required' }, { status: 400 });
  }

  // Only allow PDF and images
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF, JPG, PNG, WEBP allowed' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitise filename: timestamp + original name
  const ext = path.extname(file.name);
  const safeName = `${Date.now()}-${path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', mrn);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  const fileUrl = `/uploads/${mrn}/${safeName}`;

  return NextResponse.json({ fileUrl, label, uploadedAt: new Date().toISOString() });
}
