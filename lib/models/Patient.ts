import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPatient extends Document {
  mrn: string;
  fullName: string;
  age: number;
  dob?: Date;
  gender: string;
  contact: string;
  address?: string;
  bloodGroup?: string;
  allergies: string[];
  chronicConditions: string[];
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    mrn: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    dob: { type: Date },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    contact: { type: String, trim: true, default: '' },
    address: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },
    visitCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;
