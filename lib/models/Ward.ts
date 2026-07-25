import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWard extends Document {
  wardName: string;
  bedCapacity: number;
  createdAt: Date;
}

const WardSchema = new Schema<IWard>(
  {
    wardName: { type: String, required: true, trim: true },
    bedCapacity: { type: Number, required: true, default: 10 },
  },
  { timestamps: true }
);

const Ward: Model<IWard> =
  mongoose.models.Ward || mongoose.model<IWard>('Ward', WardSchema);

export default Ward;
