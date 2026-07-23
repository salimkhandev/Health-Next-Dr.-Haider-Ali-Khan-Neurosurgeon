import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserStatus = 'pending' | 'paid' | 'rejected' | 'expired' | 'revoked';
export type UserRole = 'student' | 'admin';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  enrolledCourseIds: mongoose.Types.ObjectId[]; // courses student has paid for
  createdAt: Date;
  accessExpiresAt: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'rejected', 'expired', 'revoked'],
      default: 'pending',
    },
    enrolledCourseIds: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    accessExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes — also created explicitly in db-indexes.ts for Atlas setup
UserSchema.index({ status: 1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

export default User;
