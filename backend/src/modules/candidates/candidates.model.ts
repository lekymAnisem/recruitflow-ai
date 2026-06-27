import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkHistory {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrent?: boolean;
}

export interface IEducation {
  institution: string;
  degree?: string;
  field?: string;
  startYear?: string;
  endYear?: string;
}

export interface ICandidate extends Document {
  organizationId: mongoose.Types.ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  yearsOfExperience?: number;
  summary?: string;
  skills: string[];
  workHistory: IWorkHistory[];
  education: IEducation[];
  resumeIds: mongoose.Types.ObjectId[];
  tagIds: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<ICandidate>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    location: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    yearsOfExperience: { type: Number },
    summary: { type: String },
    skills: [{ type: String }],
    workHistory: [
      {
        company: { type: String },
        title: { type: String },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String },
        isCurrent: { type: Boolean, default: false },
      },
    ],
    education: [
      {
        institution: { type: String },
        degree: { type: String },
        field: { type: String },
        startYear: { type: String },
        endYear: { type: String },
      },
    ],
    resumeIds: [{ type: Schema.Types.ObjectId, ref: 'Resume' }],
    tagIds: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

candidateSchema.index({ organizationId: 1, fullName: 'text', email: 'text' });
candidateSchema.index({ organizationId: 1, skills: 1 });

candidateSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);
