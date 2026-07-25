import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBed extends Document {
  wardId: mongoose.Types.ObjectId;
  bedNumber: string;
  status: 'Available' | 'Occupied' | 'Under Maintenance';
  currentAdmissionId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const BedSchema = new Schema<IBed>(
  {
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true, index: true },
    bedNumber: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Available', 'Occupied', 'Under Maintenance'],
      default: 'Available',
    },
    currentAdmissionId: { type: Schema.Types.ObjectId, ref: 'Admission', default: null },
  },
  { timestamps: true }
);

const Bed: Model<IBed> =
  mongoose.models.Bed || mongoose.model<IBed>('Bed', BedSchema);

export default Bed;
