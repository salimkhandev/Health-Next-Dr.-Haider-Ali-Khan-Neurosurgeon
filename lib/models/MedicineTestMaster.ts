import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedicineTestMaster extends Document {
  type: 'medicine' | 'test';
  name: string;
  defaultDosage?: string;
  createdAt: Date;
}

const MedicineTestMasterSchema = new Schema<IMedicineTestMaster>(
  {
    type: { type: String, required: true, enum: ['medicine', 'test'] },
    name: { type: String, required: true, trim: true },
    defaultDosage: { type: String, default: '' },
  },
  { timestamps: true }
);

const MedicineTestMaster: Model<IMedicineTestMaster> =
  mongoose.models.MedicineTestMaster ||
  mongoose.model<IMedicineTestMaster>('MedicineTestMaster', MedicineTestMasterSchema);

export default MedicineTestMaster;
