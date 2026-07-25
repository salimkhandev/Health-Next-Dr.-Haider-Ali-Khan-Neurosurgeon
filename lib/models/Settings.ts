import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  doctorName: string;
  specialization: string;
  qualifications: string;
  registrationNumber: string;
  hospitalName: string;
  hospitalLogoUrl: string;
  contactDetails: string;
  specializationsList: string[];
}

const SettingsSchema = new Schema<ISettings>(
  {
    doctorName: { type: String, default: 'Dr. Haider Ali Khan' },
    specialization: { type: String, default: 'Neurosurgeon' },
    qualifications: {
      type: String,
      default: 'MBBS, FCPS (Neurosurgery), Fellowship Endoscopic Neurosurgery, CHPE, Arab Spine Diploma',
    },
    registrationNumber: { type: String, default: 'PMC-12345-N' },
    hospitalName: { type: String, default: 'Health Next' },
    hospitalLogoUrl: { type: String, default: '/DR-IMAGE.png' },
    contactDetails: { type: String, default: 'Phone: +92 300 0000000 | Email: contact@healthnext.com' },
    specializationsList: {
      type: [String],
      default: [
        'Brain & Spine Surgeries',
        'Brain Tumor Treatment',
        'Spinal Disorders (Slip Disc, Sciatica)',
        'Diagnosis & Treatment',
        'Hydrocephalus Treatment',
        'Numbness, Dizziness & Nerve Weakness',
      ],
    },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
