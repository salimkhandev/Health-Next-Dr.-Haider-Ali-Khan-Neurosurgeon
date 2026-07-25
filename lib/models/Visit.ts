import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiConversationMessage {
  role: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export interface IAiSuggestions {
  possibleConditions: { name: string; reasoning: string }[];
  suggestedTests: string[];
  suggestedMedicines: { name: string; dosage: string }[];
}

export interface IPrescribedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface IVitals {
  bp?: string;
  temperature?: number;
  pulse?: number;
  weight?: number;
}

export interface IAttachment {
  fileUrl: string;
  label: string;
  uploadedAt: Date;
}

export interface IVisit extends Document {
  mrn: string;
  visitDate: Date;
  symptoms: string[];
  aiConversation?: IAiConversationMessage[];
  aiSuggestions?: IAiSuggestions;
  confirmedDiagnosis: string;
  testsPrescribed: string[];
  medicinesPrescribed: IPrescribedMedicine[];
  doctorNotes: string;
  vitals?: IVitals;
  attachments?: IAttachment[];
  nextFollowUpDate?: Date | null;
  editableUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
  {
    mrn: { type: String, required: true, index: true },
    visitDate: { type: Date, default: Date.now },
    symptoms: { type: [String], default: [] },
    aiConversation: [
      {
        role: { type: String, enum: ['user', 'assistant'] },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    aiSuggestions: {
      possibleConditions: [{ name: String, reasoning: String }],
      suggestedTests: [String],
      suggestedMedicines: [{ name: String, dosage: String }],
    },
    confirmedDiagnosis: { type: String, default: '' },
    testsPrescribed: { type: [String], default: [] },
    medicinesPrescribed: [
      {
        name: { type: String, required: true },
        dosage: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
      },
    ],
    doctorNotes: { type: String, default: '' },
    vitals: {
      bp: { type: String, default: '' },
      temperature: { type: Number },
      pulse: { type: Number },
      weight: { type: Number },
    },
    attachments: [
      {
        fileUrl: { type: String, required: true },
        label: { type: String, default: 'Document/Scan' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    nextFollowUpDate: { type: Date, default: null },
    editableUntil: { type: Date },
  },
  { timestamps: true }
);

const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>('Visit', VisitSchema);

export default Visit;
