import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'JazzCash' | 'EasyPaisa' | 'BankTransfer' | 'Other';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId; // which course this payment is for
  name: string;
  email: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  screenshotKey?: string;   // R2 object key — never a URL
  driveFileId?: string;
  status: PaymentStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: mongoose.Types.ObjectId | null;
  adminNote: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    screenshotKey: { type: String, required: false },
    driveFileId: { type: String, required: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: () => new Date() },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    adminNote: { type: String, default: '' },
  },
  { timestamps: false } // submittedAt is manual for explicit control
);

PaymentSchema.index({ userId: 1, submittedAt: -1 });
PaymentSchema.index({ status: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
