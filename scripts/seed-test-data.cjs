/**
 * Full test data seed for NitroClinic
 * - 12 Pakistani patients (boys & girls)
 * - 3+ visits per patient spread across last 90 days (for graph variety)
 * - Realistic vitals trends, diagnoses, medicines, follow-up dates
 * - 6 patients admitted to wards (mix of ICU, Neuro Ward, General Ward)
 * Run: node scripts/seed-test-data.cjs
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

/* ---- Minimal schema declarations (matching actual models) ---- */
const PatientSchema = new mongoose.Schema({
  mrn: String, fullName: String, age: Number, dob: Date,
  gender: String, contact: String, address: String, bloodGroup: String,
  allergies: [String], chronicConditions: [String], visitCount: { type: Number, default: 0 },
}, { timestamps: true });

const VisitSchema = new mongoose.Schema({
  mrn: String,
  visitDate: Date,
  symptoms: [String],
  confirmedDiagnosis: String,
  testsPrescribed: [String],
  medicinesPrescribed: [{
    name: String, dosage: String, frequency: String, duration: String,
  }],
  doctorNotes: String,
  vitals: { bp: String, temperature: Number, pulse: Number, weight: Number },
  aiConversation: [{ role: String, message: String, timestamp: Date }],
  aiSuggestions: mongoose.Schema.Types.Mixed,
  nextFollowUpDate: Date,
  editableUntil: Date,
}, { timestamps: true });

const WardSchema = new mongoose.Schema({
  wardName: String, bedCapacity: Number,
}, { timestamps: true });

const BedSchema = new mongoose.Schema({
  wardId: mongoose.Schema.Types.ObjectId,
  bedNumber: String,
  status: { type: String, default: 'Available' },
  currentAdmissionId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

const AdmissionSchema = new mongoose.Schema({
  mrn: String,
  wardId: mongoose.Schema.Types.ObjectId,
  bedId: mongoose.Schema.Types.ObjectId,
  admissionDate: Date,
  admittingDiagnosis: String,
  attendingDoctor: String,
  status: { type: String, default: 'Admitted' },
  dischargeDate: { type: Date, default: null },
  dischargeNotes: { type: String, default: null },
}, { timestamps: true });

const CounterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
}, { timestamps: true });

const Patient = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
const Visit = mongoose.models.Visit || mongoose.model('Visit', VisitSchema);
const Ward = mongoose.models.Ward || mongoose.model('Ward', WardSchema);
const Bed = mongoose.models.Bed || mongoose.model('Bed', BedSchema);
const Admission = mongoose.models.Admission || mongoose.model('Admission', AdmissionSchema);
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

/* ---- Utility: generate MRN with atomic counter ---- */
async function generateMRN() {
  const year = new Date().getFullYear();
  const counterId = `patientMRN_${year}`;
  const prefix = `NC-${year}-`;

  const updatedCounter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const seqNumber = updatedCounter ? updatedCounter.seq : 1;
  return `${prefix}${String(seqNumber).padStart(4, '0')}`;
}

/* Utility: date X days ago */
function daysAgo(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
}

/* ---- PATIENT DEFINITIONS ---- */
const PATIENTS = [
  {
    fullName: 'Ahmed Raza Khan',
    age: 34, gender: 'Male', contact: '0300-1112233',
    address: 'House 7, Street 4, F-8/2, Islamabad',
    bloodGroup: 'A+',
    allergies: ['Penicillin'],
    chronicConditions: ['Hypertension'],
    visits: [
      {
        daysAgo: 85,
        symptoms: ['Severe headache', 'Blurred vision'],
        diagnosis: 'Migraine with Aura',
        tests: ['MRI Brain (Plain)', 'CBC (Complete Blood Count)'],
        medicines: [
          { name: 'Paracetamol', dosage: '1g', frequency: 'TDS', duration: '5 days' },
          { name: 'Pregabalin', dosage: '75mg', frequency: 'BD', duration: '1 month' },
        ],
        vitals: { bp: '145/90', temperature: 37.1, pulse: 88, weight: 78 },
        notes: 'Patient advised to avoid bright screens. MRI ordered to rule out structural pathology.',
        followUpDays: 30,
      },
      {
        daysAgo: 55,
        symptoms: ['Recurring headache', 'Neck stiffness'],
        diagnosis: 'Tension Headache with Cervical Spondylosis',
        tests: ['X-Ray Spine (Cervical AP/Lateral)', 'EMG/NCS'],
        medicines: [
          { name: 'Gabapentin', dosage: '300mg', frequency: 'TDS', duration: '1 month' },
          { name: 'Methocarbamol', dosage: '750mg', frequency: 'TDS', duration: '2 weeks' },
        ],
        vitals: { bp: '138/88', temperature: 37.0, pulse: 82, weight: 77 },
        notes: 'Cervical collar advised at night. Physiotherapy referral given.',
        followUpDays: 21,
      },
      {
        daysAgo: 10,
        symptoms: ['Headache', 'Dizziness'],
        diagnosis: 'Benign Positional Vertigo',
        tests: ['MRI Brain (With Contrast)'],
        medicines: [
          { name: 'Betahistine', dosage: '16mg', frequency: 'TDS', duration: '4 weeks' },
          { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '4 weeks' },
        ],
        vitals: { bp: '130/85', temperature: 36.9, pulse: 78, weight: 77 },
        notes: 'Epley maneuver performed in clinic. Patient reported 70% improvement.',
        followUpDays: 14,
      },
    ],
    admitToWard: 'Neuro Ward',
    admitDiagnosis: 'Cervical Spondylosis with Radiculopathy',
  },
  {
    fullName: 'Fatima Noor Siddiqui',
    age: 28, gender: 'Female', contact: '0311-9988776',
    address: 'Flat 3B, Block-5, Gulshan-e-Iqbal, Karachi',
    bloodGroup: 'B+',
    allergies: ['Sulfa drugs'],
    chronicConditions: ['Epilepsy'],
    visits: [
      {
        daysAgo: 90,
        symptoms: ['Seizure episode', 'Post-ictal confusion'],
        diagnosis: 'Generalized Tonic-Clonic Seizure',
        tests: ['EEG (Electroencephalogram)', 'MRI Brain (Plain)', 'Serum Electrolytes'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '3 months' },
        ],
        vitals: { bp: '110/70', temperature: 37.2, pulse: 92, weight: 58 },
        notes: 'First breakthrough seizure after 2 years. Compliance checked — patient missed doses.',
        followUpDays: 30,
      },
      {
        daysAgo: 60,
        symptoms: ['Minor tremors', 'Sleep disturbance'],
        diagnosis: 'Medication side-effect — Levetiracetam',
        tests: ['CBC (Complete Blood Count)', 'Liver Function Tests'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '3 months' },
          { name: 'Vitamin B12 (Methylcobalamin)', dosage: '500mcg', frequency: 'OD', duration: '1 month' },
        ],
        vitals: { bp: '108/68', temperature: 37.0, pulse: 80, weight: 57 },
        notes: 'Dose maintained. Sleep hygiene counseling given.',
        followUpDays: 30,
      },
      {
        daysAgo: 15,
        symptoms: ['Stable, no seizures'],
        diagnosis: 'Epilepsy — Controlled',
        tests: ['EEG (Electroencephalogram)'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '6 months' },
        ],
        vitals: { bp: '112/72', temperature: 36.8, pulse: 76, weight: 58 },
        notes: 'EEG shows significant improvement. Driving restriction discussed.',
        followUpDays: 60,
      },
    ],
    admitToWard: null,
  },
  {
    fullName: 'Bilal Mehmood Chaudhry',
    age: 52, gender: 'Male', contact: '0321-4455667',
    address: '24-C, Model Town Extension, Lahore',
    bloodGroup: 'O+',
    allergies: [],
    chronicConditions: ['Diabetes Type 2', 'Hypertension'],
    visits: [
      {
        daysAgo: 80,
        symptoms: ['Back pain', 'Leg weakness', 'Numbness in left foot'],
        diagnosis: 'Lumbar Disc Herniation (L4-L5)',
        tests: ['MRI Spine (Lumbar)', 'EMG/NCS', 'Blood Glucose (Fasting)'],
        medicines: [
          { name: 'Pregabalin', dosage: '75mg', frequency: 'BD', duration: '1 month' },
          { name: 'Diclofenac Sodium', dosage: '75mg', frequency: 'BD', duration: '2 weeks' },
          { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '2 weeks' },
        ],
        vitals: { bp: '155/95', temperature: 37.0, pulse: 84, weight: 88 },
        notes: 'MRI confirms L4-L5 disc herniation. Conservative management initiated.',
        followUpDays: 21,
      },
      {
        daysAgo: 45,
        symptoms: ['Persistent lower back pain', 'Improved leg weakness'],
        diagnosis: 'Lumbar Disc Herniation (L4-L5) — Partially Improved',
        tests: ['Renal Function Tests (BUN, Creatinine)', 'Serum Electrolytes'],
        medicines: [
          { name: 'Gabapentin', dosage: '300mg', frequency: 'TDS', duration: '1 month' },
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Ongoing' },
        ],
        vitals: { bp: '148/92', temperature: 36.9, pulse: 80, weight: 87 },
        notes: 'Physiotherapy completing. Surgical option discussed if no improvement in 6 weeks.',
        followUpDays: 42,
      },
      {
        daysAgo: 5,
        symptoms: ['Minimal back pain', 'No leg weakness'],
        diagnosis: 'Lumbar Disc Herniation — Recovered (Conservative)',
        tests: [],
        medicines: [
          { name: 'Pregabalin', dosage: '75mg', frequency: 'OD', duration: '1 month' },
        ],
        vitals: { bp: '142/88', temperature: 36.8, pulse: 76, weight: 86 },
        notes: 'Full recovery with conservative management. Surgery not needed. Core strengthening advised.',
        followUpDays: 90,
      },
    ],
    admitToWard: null,
  },
  {
    fullName: 'Sana Ul Haq Mirza',
    age: 19, gender: 'Female', contact: '0333-7766554',
    address: 'Village Sultanpur, Rawalpindi District',
    bloodGroup: 'A-',
    allergies: ['Aspirin'],
    chronicConditions: [],
    visits: [
      {
        daysAgo: 70,
        symptoms: ['Sudden severe headache', 'Neck stiffness', 'Photophobia'],
        diagnosis: 'Viral Meningitis (Suspected)',
        tests: ['Lumbar Puncture / CSF Analysis', 'MRI Brain (With Contrast)', 'CBC (Complete Blood Count)', 'CRP (C-Reactive Protein)'],
        medicines: [
          { name: 'Paracetamol', dosage: '1g', frequency: 'TDS', duration: '5 days' },
          { name: 'Ciprofloxacin', dosage: '500mg', frequency: 'BD', duration: '7 days' },
        ],
        vitals: { bp: '100/60', temperature: 38.8, pulse: 110, weight: 52 },
        notes: 'CSF clear, viral aetiology suspected. Admitted for IV fluids and monitoring.',
        followUpDays: 14,
      },
      {
        daysAgo: 40,
        symptoms: ['Mild headache on exertion'],
        diagnosis: 'Post-Viral Meningitis — Recovery Phase',
        tests: ['CBC (Complete Blood Count)'],
        medicines: [
          { name: 'Vitamin B12 (Methylcobalamin)', dosage: '500mcg', frequency: 'OD', duration: '1 month' },
        ],
        vitals: { bp: '104/66', temperature: 37.0, pulse: 82, weight: 52 },
        notes: 'Full neurological recovery. Cleared for university return.',
        followUpDays: 60,
      },
    ],
    admitToWard: 'ICU',
    admitDiagnosis: 'Acute Viral Meningitis — Observation',
  },
  {
    fullName: 'Hamza Tariq Butt',
    age: 41, gender: 'Male', contact: '0345-2211334',
    address: 'Plot 45, Johar Town Phase 2, Lahore',
    bloodGroup: 'B-',
    allergies: [],
    chronicConditions: ['Hypertension', 'Chronic Back Pain'],
    visits: [
      {
        daysAgo: 75,
        symptoms: ['Weakness in right arm', 'Tingling fingers', 'Neck pain'],
        diagnosis: 'Cervical Disc Herniation (C5-C6)',
        tests: ['MRI Spine (Cervical)', 'EMG/NCS', 'X-Ray Spine (Cervical AP/Lateral)'],
        medicines: [
          { name: 'Pregabalin', dosage: '75mg', frequency: 'BD', duration: '6 weeks' },
          { name: 'Methocarbamol', dosage: '750mg', frequency: 'TDS', duration: '2 weeks' },
          { name: 'Metoprolol', dosage: '50mg', frequency: 'BD', duration: 'Ongoing' },
        ],
        vitals: { bp: '150/95', temperature: 37.0, pulse: 86, weight: 82 },
        notes: 'MRI confirms C5-C6 herniation with foraminal narrowing.',
        followUpDays: 28,
      },
      {
        daysAgo: 30,
        symptoms: ['Partial improvement in arm weakness'],
        diagnosis: 'Cervical Disc Herniation — Partially Improved',
        tests: ['Coagulation Profile (PT, APTT)'],
        medicines: [
          { name: 'Gabapentin', dosage: '300mg', frequency: 'TDS', duration: '1 month' },
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Ongoing' },
        ],
        vitals: { bp: '142/90', temperature: 36.9, pulse: 82, weight: 82 },
        notes: 'Physiotherapy ongoing. EMG shows improving nerve conduction.',
        followUpDays: 30,
      },
    ],
    admitToWard: 'Neuro Ward',
    admitDiagnosis: 'Cervical Disc Herniation C5-C6 — Post-Physio Monitoring',
  },
  {
    fullName: 'Ayesha Bashir Ansari',
    age: 45, gender: 'Female', contact: '0312-6677889',
    address: 'House 22, Block D, PECHS, Karachi',
    bloodGroup: 'O-',
    allergies: ['Penicillin', 'Codeine'],
    chronicConditions: ['Diabetes Type 2', 'Migraine'],
    visits: [
      {
        daysAgo: 88,
        symptoms: ['Numbness in both legs', 'Urinary incontinence'],
        diagnosis: 'Spinal Cord Compression (T10-T11)',
        tests: ['MRI Spine (Lumbar)', 'CT Scan Brain (Plain)', 'Renal Function Tests (BUN, Creatinine)'],
        medicines: [
          { name: 'Dexamethasone', dosage: '8mg IV/IM BD', frequency: 'BD', duration: '5 days' },
          { name: 'Mannitol 20%', dosage: '100ml IV over 20 min', frequency: 'BD', duration: '3 days' },
        ],
        vitals: { bp: '160/98', temperature: 37.4, pulse: 94, weight: 72 },
        notes: 'Emergency MRI confirmed cord compression at T10-T11. Surgical consultation arranged.',
        followUpDays: 7,
      },
      {
        daysAgo: 50,
        symptoms: ['Post-operative, improving sensation'],
        diagnosis: 'Post-Decompression Surgery — Recovery',
        tests: ['CBC (Complete Blood Count)', 'CRP (C-Reactive Protein)'],
        medicines: [
          { name: 'Pregabalin', dosage: '75mg', frequency: 'BD', duration: '3 months' },
          { name: 'Ceftriaxone', dosage: '2g IV OD', frequency: 'OD', duration: '10 days' },
          { name: 'Omeprazole', dosage: '20mg', frequency: 'OD', duration: '4 weeks' },
        ],
        vitals: { bp: '138/88', temperature: 37.1, pulse: 84, weight: 71 },
        notes: 'Decompressive laminectomy performed. Bladder function partially restored.',
        followUpDays: 30,
      },
      {
        daysAgo: 12,
        symptoms: ['Mild leg weakness remaining'],
        diagnosis: 'Spinal Cord Injury — Rehabilitation Phase',
        tests: ['Vitamin D Level', 'Serum Calcium & Phosphorus'],
        medicines: [
          { name: 'Pregabalin', dosage: '75mg', frequency: 'BD', duration: '3 months' },
          { name: 'Baclofen', dosage: '10mg', frequency: 'TDS', duration: '2 months' },
          { name: 'Vitamin B12 (Methylcobalamin)', dosage: '500mcg', frequency: 'OD', duration: '3 months' },
        ],
        vitals: { bp: '132/84', temperature: 36.8, pulse: 78, weight: 70 },
        notes: 'Rehabilitation progressing well. Physiotherapy 3x weekly.',
        followUpDays: 30,
      },
    ],
    admitToWard: 'ICU',
    admitDiagnosis: 'Post-Decompressive Laminectomy — Spinal Cord Compression T10-T11',
  },
  {
    fullName: 'Usman Ali Qureshi',
    age: 23, gender: 'Male', contact: '0336-5544332',
    address: 'Sector G-11/2, Islamabad',
    bloodGroup: 'AB+',
    allergies: [],
    chronicConditions: [],
    visits: [
      {
        daysAgo: 65,
        symptoms: ['Road accident head trauma', 'Loss of consciousness', 'Vomiting'],
        diagnosis: 'Subdural Hematoma (Acute)',
        tests: ['CT Scan Brain (With Contrast)', 'Coagulation Profile (PT, APTT)', 'CBC (Complete Blood Count)'],
        medicines: [
          { name: 'Mannitol 20%', dosage: '100ml IV over 20 min', frequency: 'Q6H', duration: '3 days' },
          { name: 'Phenytoin (Dilantin)', dosage: '100mg', frequency: 'TDS', duration: '1 month' },
        ],
        vitals: { bp: '120/78', temperature: 37.8, pulse: 104, weight: 70 },
        notes: 'Emergency burr-hole evacuation performed. GCS improved from 9 to 14.',
        followUpDays: 14,
      },
      {
        daysAgo: 35,
        symptoms: ['Mild headache', 'Improving cognition'],
        diagnosis: 'Post-Subdural Hematoma — Recovery',
        tests: ['CT Scan Brain (Plain)', 'EEG (Electroencephalogram)'],
        medicines: [
          { name: 'Phenytoin (Dilantin)', dosage: '100mg', frequency: 'TDS', duration: '3 months' },
          { name: 'Paracetamol', dosage: '1g', frequency: 'PRN', duration: '2 weeks' },
        ],
        vitals: { bp: '118/76', temperature: 36.9, pulse: 80, weight: 70 },
        notes: 'Repeat CT shows near-complete resolution of hematoma.',
        followUpDays: 30,
      },
    ],
    admitToWard: 'ICU',
    admitDiagnosis: 'Acute Subdural Hematoma — Post-Evacuation Monitoring',
  },
  {
    fullName: 'Zainab Iftikhar Rasheed',
    age: 32, gender: 'Female', contact: '0301-8899001',
    address: '16-B, DHA Phase 3, Lahore',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: ['Lupus'],
    visits: [
      {
        daysAgo: 72,
        symptoms: ['Persistent headache', 'Vision changes', 'Papilledema on fundoscopy'],
        diagnosis: 'Idiopathic Intracranial Hypertension (IIH)',
        tests: ['MRI Brain (With Contrast)', 'Lumbar Puncture / CSF Analysis', 'Visual Field Testing'],
        medicines: [
          { name: 'Furosemide', dosage: '40mg', frequency: 'BD', duration: '1 month' },
        ],
        vitals: { bp: '128/82', temperature: 37.0, pulse: 80, weight: 96 },
        notes: 'Opening CSF pressure 32 cmH2O. Weight loss strongly advised.',
        followUpDays: 21,
      },
      {
        daysAgo: 30,
        symptoms: ['Improved headache', 'Persistent tinnitus'],
        diagnosis: 'IIH — Partially Controlled',
        tests: ['Visual Field Testing'],
        medicines: [
          { name: 'Furosemide', dosage: '40mg', frequency: 'OD', duration: '1 month' },
        ],
        vitals: { bp: '122/78', temperature: 36.9, pulse: 76, weight: 93 },
        notes: '3 kg weight reduction achieved. Visual fields stable.',
        followUpDays: 30,
      },
    ],
    admitToWard: null,
  },
  {
    fullName: 'Omar Farooq Sheikh',
    age: 60, gender: 'Male', contact: '0302-3344556',
    address: 'House 12, Street 6, G-9/1, Islamabad',
    bloodGroup: 'B+',
    allergies: ['NSAIDs'],
    chronicConditions: ['Diabetes Type 2', 'Chronic Kidney Disease Stage 3'],
    visits: [
      {
        daysAgo: 78,
        symptoms: ['Progressive weakness of both legs', 'Bladder dysfunction'],
        diagnosis: 'Cervical Myelopathy (C3-C4)',
        tests: ['MRI Spine (Cervical)', 'EMG/NCS', 'Renal Function Tests (BUN, Creatinine)', 'Blood Glucose (Fasting)'],
        medicines: [
          { name: 'Dexamethasone', dosage: '8mg IV/IM BD', frequency: 'BD', duration: '5 days' },
          { name: 'Pregabalin', dosage: '75mg', frequency: 'OD', duration: '1 month' },
        ],
        vitals: { bp: '162/100', temperature: 37.2, pulse: 88, weight: 74 },
        notes: 'MRI shows multilevel C-spine spondylosis with cord signal change at C3-C4.',
        followUpDays: 14,
      },
      {
        daysAgo: 20,
        symptoms: ['Post-operative leg weakness improving'],
        diagnosis: 'Cervical Myelopathy — Post-Surgical',
        tests: ['CBC (Complete Blood Count)', 'Serum Electrolytes'],
        medicines: [
          { name: 'Gabapentin', dosage: '300mg', frequency: 'BD', duration: '2 months' },
          { name: 'Baclofen', dosage: '10mg', frequency: 'TDS', duration: '2 months' },
          { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD', duration: '4 weeks' },
        ],
        vitals: { bp: '148/92', temperature: 36.8, pulse: 82, weight: 73 },
        notes: 'ACDF surgery completed at C3-C4. Neurological examination shows improvement.',
        followUpDays: 21,
      },
    ],
    admitToWard: 'Neuro Ward',
    admitDiagnosis: 'Cervical Myelopathy C3-C4 — Post-ACDF Surgery',
  },
  {
    fullName: 'Mahnoor Javaid Akhtar',
    age: 16, gender: 'Female', contact: '0344-7788990',
    address: 'Flat 5, Askari Apartments, Peshawar Road, Rawalpindi',
    bloodGroup: 'O+',
    allergies: [],
    chronicConditions: [],
    visits: [
      {
        daysAgo: 50,
        symptoms: ['Headache', 'Weakness of right hand', 'Grade 2 brain tumor detected on MRI'],
        diagnosis: 'Low-Grade Glioma (Frontal Lobe)',
        tests: ['MRI Brain (With Contrast)', 'CT Angiography Brain', 'Coagulation Profile (PT, APTT)'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '6 months' },
          { name: 'Dexamethasone', dosage: '8mg IV/IM BD', frequency: 'BD', duration: '1 week' },
        ],
        vitals: { bp: '108/68', temperature: 37.0, pulse: 86, weight: 48 },
        notes: 'Multidisciplinary oncology meeting scheduled. Surgical resection planned.',
        followUpDays: 14,
      },
      {
        daysAgo: 7,
        symptoms: ['Post-operative headache', 'Mild right hand weakness'],
        diagnosis: 'Post-Craniotomy — Glioma Resection',
        tests: ['MRI Brain (With Contrast)', 'CBC (Complete Blood Count)'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '6 months' },
          { name: 'Dexamethasone', dosage: '4mg', frequency: 'TDS', duration: '5 days tapering' },
          { name: 'Ceftriaxone', dosage: '2g IV OD', frequency: 'OD', duration: '10 days' },
        ],
        vitals: { bp: '110/70', temperature: 37.3, pulse: 90, weight: 47 },
        notes: 'GTR achieved intraoperatively. Neuropathology pending. Oncology follow-up scheduled.',
        followUpDays: 14,
      },
    ],
    admitToWard: 'Neuro Ward',
    admitDiagnosis: 'Post-Craniotomy — Frontal Lobe Glioma Resection',
  },
  {
    fullName: 'Saad Abdullah Niazi',
    age: 38, gender: 'Male', contact: '0315-6655443',
    address: 'House 8, Block A, Satellite Town, Gujranwala',
    bloodGroup: 'A+',
    allergies: [],
    chronicConditions: [],
    visits: [
      {
        daysAgo: 40,
        symptoms: ['Intermittent blackouts', 'Confusion episodes', 'Jerking of limbs'],
        diagnosis: 'Temporal Lobe Epilepsy',
        tests: ['EEG (Electroencephalogram)', 'MRI Brain (Plain)', 'CBC (Complete Blood Count)', 'Thyroid Function Tests (TSH, T3, T4)'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '6 months' },
          { name: 'Pregabalin', dosage: '75mg', frequency: 'OD', duration: '2 months' },
        ],
        vitals: { bp: '124/80', temperature: 37.0, pulse: 78, weight: 80 },
        notes: 'EEG shows temporal lobe spikes. MRI normal. AED therapy initiated.',
        followUpDays: 30,
      },
      {
        daysAgo: 8,
        symptoms: ['Controlled, only 1 minor episode in past month'],
        diagnosis: 'Temporal Lobe Epilepsy — Improving',
        tests: ['EEG (Electroencephalogram)'],
        medicines: [
          { name: 'Levetiracetam (Keppra)', dosage: '500mg', frequency: 'BD', duration: '6 months' },
        ],
        vitals: { bp: '120/78', temperature: 36.8, pulse: 74, weight: 80 },
        notes: 'Good medication response. Work return discussed with caution re: driving.',
        followUpDays: 60,
      },
    ],
    admitToWard: null,
  },
  {
    fullName: 'Hira Ghulam Nabi',
    age: 55, gender: 'Female', contact: '0322-1100998',
    address: 'House 3, Street 18, Liaquatabad, Karachi',
    bloodGroup: 'B+',
    allergies: ['Morphine'],
    chronicConditions: ['Hypertension', 'Osteoporosis'],
    visits: [
      {
        daysAgo: 60,
        symptoms: ['Sudden severe headache', 'Vomiting', 'Neck rigidity'],
        diagnosis: 'Subarachnoid Hemorrhage (SAH)',
        tests: ['CT Scan Brain (Plain)', 'CT Angiography Brain', 'Lumbar Puncture / CSF Analysis', 'Coagulation Profile (PT, APTT)'],
        medicines: [
          { name: 'Mannitol 20%', dosage: '100ml IV over 20 min', frequency: 'Q6H', duration: '3 days' },
          { name: 'Dexamethasone', dosage: '8mg IV/IM BD', frequency: 'BD', duration: '5 days' },
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Ongoing' },
        ],
        vitals: { bp: '185/110', temperature: 37.6, pulse: 104, weight: 65 },
        notes: 'CT Angiography reveals 7mm posterior communicating artery aneurysm. Neurovascular team consulted.',
        followUpDays: 7,
      },
      {
        daysAgo: 30,
        symptoms: ['Post-clipping headache', 'Mild confusion resolving'],
        diagnosis: 'SAH — Post-Surgical Clipping (PCoA Aneurysm)',
        tests: ['CT Scan Brain (With Contrast)', 'Serum Electrolytes'],
        medicines: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Ongoing' },
          { name: 'Metoprolol', dosage: '50mg', frequency: 'BD', duration: 'Ongoing' },
          { name: 'Phenytoin (Dilantin)', dosage: '100mg', frequency: 'TDS', duration: '3 months' },
        ],
        vitals: { bp: '142/88', temperature: 37.0, pulse: 80, weight: 64 },
        notes: 'Clipping of PCoA aneurysm completed. Vasospasm prophylaxis in place.',
        followUpDays: 21,
      },
      {
        daysAgo: 3,
        symptoms: ['Recovery, cognitive function returning'],
        diagnosis: 'SAH — Stable Recovery Phase',
        tests: ['Vitamin D Level', 'Serum Calcium & Phosphorus'],
        medicines: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD', duration: 'Ongoing' },
          { name: 'Metoprolol', dosage: '50mg', frequency: 'BD', duration: 'Ongoing' },
        ],
        vitals: { bp: '136/86', temperature: 36.8, pulse: 76, weight: 64 },
        notes: 'GCS 15/15. Cognitive testing normal. Rehabilitation plan initiated.',
        followUpDays: 21,
      },
    ],
    admitToWard: 'General Ward',
    admitDiagnosis: 'SAH Post-Clipping — Rehabilitation Phase',
  },
];

/* ---- MAIN SEED FUNCTION ---- */
async function seedTestData() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB\n');

  // Fetch wards
  const wards = await Ward.find().lean();
  if (wards.length === 0) {
    console.error('❌  No wards found. Run seed-nitroclinic.cjs first!');
    process.exit(1);
  }
  const wardMap = {};
  for (const w of wards) wardMap[w.wardName] = w;
  console.log(`✅  Found ${wards.length} wards: ${Object.keys(wardMap).join(', ')}\n`);

  for (const p of PATIENTS) {
    // Check if patient already exists by contact
    const existing = await Patient.findOne({ contact: p.contact });
    if (existing) {
      console.log(`⚠   Skipping ${p.fullName} (${existing.mrn}) — already exists`);
      continue;
    }

    // Generate MRN
    const mrn = await generateMRN();

    // Create patient
    const patient = await Patient.create({
      mrn,
      fullName: p.fullName,
      age: p.age,
      gender: p.gender,
      contact: p.contact,
      address: p.address,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies,
      chronicConditions: p.chronicConditions,
      visitCount: p.visits.length,
    });
    console.log(`✅  Patient: ${p.fullName}  →  ${mrn}`);

    // Create visits spread across past days
    for (const v of p.visits) {
      const visitDate = daysAgo(v.daysAgo);
      const editableUntil = new Date(visitDate);
      editableUntil.setHours(23, 59, 59);

      const followUpDate = v.followUpDays
        ? new Date(visitDate.getTime() + v.followUpDays * 24 * 60 * 60 * 1000)
        : null;

      await Visit.create({
        mrn,
        visitDate,
        symptoms: v.symptoms,
        confirmedDiagnosis: v.diagnosis,
        testsPrescribed: v.tests,
        medicinesPrescribed: v.medicines,
        doctorNotes: v.notes,
        vitals: v.vitals,
        nextFollowUpDate: followUpDate,
        editableUntil,
        aiConversation: [],
        aiSuggestions: {},
      });
      console.log(`   └─ Visit (${v.daysAgo}d ago): ${v.diagnosis}`);
    }

    // Admit to ward if specified
    if (p.admitToWard && wardMap[p.admitToWard]) {
      const ward = wardMap[p.admitToWard];
      const freeBed = await Bed.findOne({ wardId: ward._id, status: 'Available' });

      if (freeBed) {
        const admission = await Admission.create({
          mrn,
          wardId: ward._id,
          bedId: freeBed._id,
          admissionDate: daysAgo(p.visits[p.visits.length - 1].daysAgo),
          admittingDiagnosis: p.admitDiagnosis,
          attendingDoctor: 'Dr. Haider Ali Khan',
          status: 'Admitted',
        });

        freeBed.status = 'Occupied';
        freeBed.currentAdmissionId = admission._id;
        await freeBed.save();

        console.log(`   └─ 🏥 Admitted to ${p.admitToWard} — Bed: ${freeBed.bedNumber}`);
      } else {
        console.log(`   └─ ⚠  No free bed in ${p.admitToWard}`);
      }
    }

    console.log('');
  }

  // Final stats
  const totalPat = await Patient.countDocuments();
  const totalVis = await Visit.countDocuments();
  const totalAdm = await Admission.countDocuments({ status: 'Admitted' });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉  Seed complete!`);
  console.log(`   Total Patients:    ${totalPat}`);
  console.log(`   Total Visits:      ${totalVis}`);
  console.log(`   Active Admissions: ${totalAdm}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seedTestData().catch((err) => {
  console.error('❌  Seed failed:', err.message || err);
  process.exit(1);
});
