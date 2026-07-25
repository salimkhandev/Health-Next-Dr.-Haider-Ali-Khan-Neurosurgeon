import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Patient from '@/lib/models/Patient';
import Visit from '@/lib/models/Visit';
import Ward from '@/lib/models/Ward';
import Bed from '@/lib/models/Bed';
import Admission from '@/lib/models/Admission';
import Settings from '@/lib/models/Settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/dashboard — Analytics overview data & stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  // 1. Total counts
  const totalPatients = await Patient.countDocuments();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayVisits = await Visit.countDocuments({
    visitDate: { $gte: startOfToday },
  });

  const activeAdmissions = await Admission.countDocuments({ status: 'Admitted' });

  const totalBeds = await Bed.countDocuments();
  const occupiedBeds = await Bed.countDocuments({ status: 'Occupied' });
  const overallOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // 2. Follow-ups Due This Week (FR-10.2)
  const now = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(now.getDate() + 7);

  const followUpVisits = await Visit.find({
    nextFollowUpDate: { $gte: now, $lte: endOfWeek },
  })
    .sort({ nextFollowUpDate: 1 })
    .limit(10)
    .lean();

  const followUpsDue = await Promise.all(
    followUpVisits.map(async (v) => {
      const patient = await Patient.findOne({ mrn: v.mrn }).lean();
      return {
        _id: v._id,
        mrn: v.mrn,
        patientName: patient?.fullName || v.mrn,
        patientContact: patient?.contact || '',
        nextFollowUpDate: v.nextFollowUpDate,
        confirmedDiagnosis: v.confirmedDiagnosis,
      };
    })
  );

  // 3. Top Diagnoses Breakdown — only completed visits have a confirmed diagnosis
  const visits = await Visit.find(
    { status: 'complete', confirmedDiagnosis: { $ne: '' } },
    { confirmedDiagnosis: 1 }
  ).lean();
  const dxCounts: Record<string, number> = {};
  visits.forEach((v) => {
    const dx = v.confirmedDiagnosis.trim();
    if (dx) dxCounts[dx] = (dxCounts[dx] || 0) + 1;
  });

  const sortedDx = Object.entries(dxCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 4. Ward Occupancy Rates for Chart.js
  const wards = await Ward.find().lean();
  const wardStats = await Promise.all(
    wards.map(async (w) => {
      const wardBeds = await Bed.find({ wardId: w._id }).lean();
      const occ = wardBeds.filter((b) => b.status === 'Occupied').length;
      return {
        wardName: w.wardName,
        total: wardBeds.length,
        occupied: occ,
        available: wardBeds.length - occ,
        rate: wardBeds.length > 0 ? Math.round((occ / wardBeds.length) * 100) : 0,
      };
    })
  );

  // 5. Doctor & Practice Settings
  const settings = await Settings.findOne().lean();

  return NextResponse.json({
    kpis: {
      totalPatients,
      todayVisits,
      activeAdmissions,
      totalBeds,
      occupiedBeds,
      overallOccupancyRate,
    },
    followUpsDue,
    topDiagnoses: sortedDx.map(([name, count]) => ({ name, count })),
    wardStats,
    settings,
  });
}
