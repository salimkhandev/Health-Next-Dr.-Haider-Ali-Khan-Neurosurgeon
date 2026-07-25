import { connectDB } from '@/lib/db';
import Counter from '@/lib/models/Counter';
import Patient from '@/lib/models/Patient';

/**
 * Generates a unique MRN using an atomic counter (Layer 1 defense).
 * Format: NC-YYYY-XXXX (e.g. NC-2026-0001)
 * Uses findOneAndUpdate with $inc: { seq: 1 } for thread-safe atomic sequence generation.
 */
export async function generateMRN(): Promise<string> {
  await connectDB();
  const year = new Date().getFullYear();
  const counterId = `patientMRN_${year}`;
  const prefix = `NC-${year}-`;

  // First, check if counter document exists; if not, sync with maximum existing patient MRN sequence
  let counter = await Counter.findById(counterId);

  if (!counter) {
    // Find highest existing sequence for this year to sync counter
    const lastPatient = await Patient.findOne(
      { mrn: { $regex: `^${prefix}` } },
      { mrn: 1 }
    ).sort({ mrn: -1 });

    let initialSeq = 0;
    if (lastPatient) {
      const parts = lastPatient.mrn.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        initialSeq = lastSeq;
      }
    }

    // Initialize atomic counter with highest existing sequence
    await Counter.updateOne(
      { _id: counterId },
      { $setOnInsert: { seq: initialSeq } },
      { upsert: true }
    );
  }

  // Atomic increment operation - guarantees zero duplicates under concurrent calls
  const updatedCounter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqNumber = updatedCounter ? updatedCounter.seq : 1;
  return `${prefix}${String(seqNumber).padStart(4, '0')}`;
}
