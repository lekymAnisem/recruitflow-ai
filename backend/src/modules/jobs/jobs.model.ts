import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  location?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'open' | 'closed' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary'],
    },
    location: { type: String },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'archived'],
      default: 'open',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

jobSchema.index({ organizationId: 1, status: 1 });
jobSchema.index({ organizationId: 1, title: 'text', companyName: 'text' });

jobSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
