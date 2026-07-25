/**
 * Seeds the medicine and test master list with common neurosurgical medicines and tests.
 * Run: node scripts/seed-master-list.cjs
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

const Schema = new mongoose.Schema({
  type: String, name: String, defaultDosage: String,
}, { timestamps: true });

const MasterList = mongoose.models.MedicineTestMaster || mongoose.model('MedicineTestMaster', Schema);

const MEDICINES = [
  { name: 'Dexamethasone', defaultDosage: '8mg IV/IM BD' },
  { name: 'Mannitol 20%', defaultDosage: '100ml IV over 20 min' },
  { name: 'Phenytoin (Dilantin)', defaultDosage: '100mg TDS' },
  { name: 'Levetiracetam (Keppra)', defaultDosage: '500mg BD' },
  { name: 'Gabapentin', defaultDosage: '300mg TDS' },
  { name: 'Pregabalin', defaultDosage: '75mg BD' },
  { name: 'Tramadol', defaultDosage: '50mg TDS' },
  { name: 'Paracetamol', defaultDosage: '1g TDS' },
  { name: 'Diclofenac Sodium', defaultDosage: '75mg BD' },
  { name: 'Omeprazole', defaultDosage: '20mg OD' },
  { name: 'Pantoprazole', defaultDosage: '40mg OD' },
  { name: 'Aspirin', defaultDosage: '75mg OD' },
  { name: 'Clopidogrel', defaultDosage: '75mg OD' },
  { name: 'Heparin', defaultDosage: '5000 IU SC BD' },
  { name: 'Ciprofloxacin', defaultDosage: '500mg BD' },
  { name: 'Ceftriaxone', defaultDosage: '2g IV OD' },
  { name: 'Meropenem', defaultDosage: '1g IV TDS' },
  { name: 'Metronidazole', defaultDosage: '500mg TDS' },
  { name: 'Furosemide', defaultDosage: '40mg OD' },
  { name: 'Amlodipine', defaultDosage: '5mg OD' },
  { name: 'Metoprolol', defaultDosage: '50mg BD' },
  { name: 'Baclofen', defaultDosage: '10mg TDS' },
  { name: 'Methocarbamol', defaultDosage: '750mg TDS' },
  { name: 'Vitamin B12 (Methylcobalamin)', defaultDosage: '500mcg OD' },
  { name: 'Betahistine', defaultDosage: '16mg TDS' },
];

const TESTS = [
  { name: 'MRI Brain (Plain)' },
  { name: 'MRI Brain (With Contrast)' },
  { name: 'MRI Spine (Cervical)' },
  { name: 'MRI Spine (Lumbar)' },
  { name: 'CT Scan Brain (Plain)' },
  { name: 'CT Scan Brain (With Contrast)' },
  { name: 'CT Angiography Brain' },
  { name: 'EEG (Electroencephalogram)' },
  { name: 'EMG/NCS' },
  { name: 'Lumbar Puncture / CSF Analysis' },
  { name: 'CBC (Complete Blood Count)' },
  { name: 'CRP (C-Reactive Protein)' },
  { name: 'Coagulation Profile (PT, APTT)' },
  { name: 'Serum Electrolytes' },
  { name: 'Blood Glucose (Fasting)' },
  { name: 'Renal Function Tests (BUN, Creatinine)' },
  { name: 'Liver Function Tests' },
  { name: 'Serum Calcium & Phosphorus' },
  { name: 'Thyroid Function Tests (TSH, T3, T4)' },
  { name: 'Vitamin D Level' },
  { name: 'Vitamin B12 Level' },
  { name: 'X-Ray Spine (Cervical AP/Lateral)' },
  { name: 'X-Ray Spine (Lumbar AP/Lateral)' },
  { name: 'Doppler Ultrasound Carotid Arteries' },
  { name: 'Visual Field Testing' },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  let added = 0;
  for (const m of MEDICINES) {
    const exists = await MasterList.findOne({ type: 'medicine', name: m.name });
    if (!exists) { await MasterList.create({ type: 'medicine', ...m }); added++; }
  }
  for (const t of TESTS) {
    const exists = await MasterList.findOne({ type: 'test', name: t.name });
    if (!exists) { await MasterList.create({ type: 'test', ...t }); added++; }
  }

  console.log(`✅  ${added} items added to master list (${MEDICINES.length} medicines, ${TESTS.length} tests)`);
  console.log('🎉  Master list seed complete!\n');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌  Seed failed:', err); process.exit(1); });
