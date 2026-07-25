import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShareLink extends Document {
  mrn: string;
  visitId?: mongoose.Types.ObjectId | null;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    mrn: { type: String, required: true, index: true },
    visitId: { type: Schema.Types.ObjectId, ref: 'Visit', default: null },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ShareLink: Model<IShareLink> =
  mongoose.models.ShareLink || mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);

export default ShareLink;
