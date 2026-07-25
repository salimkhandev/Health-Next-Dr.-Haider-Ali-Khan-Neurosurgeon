/**
 * NitroClinic database seeder — Batch 1
 * Populates: initial admin user, doctor settings, default wards
 *
 * Usage: node scripts/seed-nitroclinic.cjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env.local');
  process.exit(1);
}

// --- Inline schemas (minimal, for seed use only) ---
const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, passwordHash: String, role: String,
});
const SettingsSchema = new mongoose.Schema({
  doctorName: String, specialization: String, qualifications: String,
  registrationNumber: String, hospitalName: String, hospitalLogoUrl: String,
  contactDetails: String, specializationsList: [String],
});
const WardSchema = new mongoose.Schema({ wardName: String, bedCapacity: Number });
const BedSchema = new mongoose.Schema({
  wardId: mongoose.Schema.Types.ObjectId, bedNumber: String,
  status: { type: String, default: 'Available' }, currentAdmissionId: { type: mongoose.Schema.Types.ObjectId, default: null },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
const Ward = mongoose.models.Ward || mongoose.model('Ward', WardSchema);
const Bed = mongoose.models.Bed || mongoose.model('Bed', BedSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // 1. Doctor user
  const existing = await User.findOne({ email: 'doctor@healthnext.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('clinic@2026', 10);
    await User.create({ name: 'Dr. Haider Ali Khan', email: 'doctor@healthnext.com', passwordHash, role: 'doctor' });
    console.log('✅  Doctor user created  →  doctor@healthnext.com / clinic@2026');
  } else {
    console.log('ℹ️   Doctor user already exists');
  }

  // 2. Settings
  const existingSettings = await Settings.findOne({});
  if (!existingSettings) {
    await Settings.create({
      doctorName: 'Dr. Haider Ali Khan',
      specialization: 'Neurosurgeon',
      qualifications: 'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma',
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
    });
    console.log('✅  Settings created');
  } else {
    console.log('ℹ️   Settings already exist');
  }

  // 3. Default Wards + Beds
  const wardDefs = [
    { name: 'ICU', capacity: 8 },
    { name: 'Neuro Ward', capacity: 20 },
    { name: 'General Ward', capacity: 30 },
  ];

  for (const def of wardDefs) {
    let ward = await Ward.findOne({ wardName: def.name });
    if (!ward) {
      ward = await Ward.create({ wardName: def.name, bedCapacity: def.capacity });
      console.log(`✅  Ward created: ${def.name} (${def.capacity} beds)`);
      // Create beds for this ward
      const bedPromises = [];
      for (let i = 1; i <= def.capacity; i++) {
        bedPromises.push(Bed.create({ wardId: ward._id, bedNumber: `${def.name.replace(/\s/g, '')}-${String(i).padStart(2, '0')}`, status: 'Available' }));
      }
      await Promise.all(bedPromises);
      console.log(`   └─ ${def.capacity} beds created for ${def.name}`);
    } else {
      console.log(`ℹ️   Ward already exists: ${def.name}`);
    }
  }

  console.log('\n🎉  Seed complete! Login: doctor@healthnext.com / clinic@2026\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
