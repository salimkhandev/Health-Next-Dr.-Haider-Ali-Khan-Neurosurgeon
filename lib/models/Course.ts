import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVideo {
  _id: mongoose.Types.ObjectId;
  order: number;
  title: string;
  duration: number;   // seconds
  r2Key?: string;
  driveFileId?: string;
  sizeBytes: number;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  thumbnailKey?: string;
  driveThumbnailUrl?: string;
  videos: IVideo[];
  price: number;          // enrollment fee in PKR
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    duration: { type: Number, required: true },
    r2Key: { type: String, required: false },
    driveFileId: { type: String, required: false },
    sizeBytes: { type: Number, required: true },
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    thumbnailKey: { type: String, required: false },
    driveThumbnailUrl: { type: String, required: false },
    price: { type: Number, required: true, default: 5000 }, // PKR
    videos: { type: [VideoSchema], default: [] },
  },
  { timestamps: true }
);

const Course: Model<ICourse> =
  mongoose.models.Course ?? mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
