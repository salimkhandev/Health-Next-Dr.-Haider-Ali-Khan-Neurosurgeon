import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdmission extends Document {
  mrn: string;
  wardId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  admissionDate: Date;
  admittingDiagnosis: string;
  attendingDoctor: string;
  dischargeDate?: Date | null;
  dischargeNotes?: string | null;
  status: 'Admitted' | 'Discharged';
  createdAt: Date;
}

const AdmissionSchema = new Schema<IAdmission>(
  {
    mrn: { type: String, required: true, index: true },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    admissionDate: { type: Date, default: Date.now },
    admittingDiagnosis: { type: String, default: '' },
    attendingDoctor: { type: String, default: 'Dr. Haider Ali Khan' },
    dischargeDate: { type: Date, default: null },
    dischargeNotes: { type: String, default: null },
    status: { type: String, enum: ['Admitted', 'Discharged'], default: 'Admitted' },
  },
  { timestamps: true }
);

const Admission: Model<IAdmission> =
  mongoose.models.Admission || mongoose.model<IAdmission>('Admission', AdmissionSchema);

export default Admission;
