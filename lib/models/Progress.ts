import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;
  watchedSeconds: number;
  completed: boolean;   // true once watchedSeconds >= 90% of video duration
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    videoId: { type: Schema.Types.ObjectId, required: true },
    watchedSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

// Unique compound index — always upsert, never insert duplicates
ProgressSchema.index({ userId: 1, courseId: 1, videoId: 1 }, { unique: true });

const Progress: Model<IProgress> =
  mongoose.models.Progress ?? mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
