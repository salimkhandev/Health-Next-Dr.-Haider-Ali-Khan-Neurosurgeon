import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Settings from '@/lib/models/Settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/settings — Fetch system settings
export async function GET() {
  await connectDB();
  let settings = await Settings.findOne().lean();

  if (!settings) {
    // Create default settings if not exists
    settings = (
      await Settings.create({
        doctorName: 'Dr. Haider Ali Khan',
        specialization: 'Neurosurgeon',
        qualifications:
          'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma',
        registrationNumber: 'PMC-12345-N',
        hospitalName: 'Health Next',
        hospitalLogoUrl: '/DR-IMAGE.png',
        contactDetails: 'Phone: +92 300 0000000 | Email: contact@healthnext.com',
        specializationsList: [
          'Brain & Spine Surgeries',
          'Brain Tumor Treatment',
          'Spinal Disorders (Slip Disc, Sciatica)',
          'Diagnosis & Treatment',
          'Hydrocephalus Treatment',
          'Numbness, Dizziness & Nerve Weakness',
        ],
      })
    ).toObject();
  }

  return NextResponse.json({ settings });
}

// PUT /api/settings — Update system settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const body = await req.json();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(body);
  } else {
    Object.assign(settings, body);
    await settings.save();
  }

  return NextResponse.json({ settings });
}
