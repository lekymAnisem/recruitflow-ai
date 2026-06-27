import mongoose, { Schema, Document } from 'mongoose';

export interface IParsedData {
  fullName?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  summary?: string;
  workHistory?: any[];
  education?: any[];
}

export interface IResume extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId?: mongoose.Types.ObjectId;
  fileName: string;
  filePath: string;
  mimeType?: string;
  fileSize?: number;
  rawText?: string;
  parsedData?: IParsedData;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      index: true,
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String },
    fileSize: { type: Number },
    rawText: { type: String },
    parsedData: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      skills: [{ type: String }],
      summary: { type: String },
      workHistory: [{ type: Schema.Types.Mixed }],
      education: [{ type: Schema.Types.Mixed }],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

resumeSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);
