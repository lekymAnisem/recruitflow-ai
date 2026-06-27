import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Submitted' | 'Offer' | 'Hired' | 'Rejected';
  aiAnalysisId?: mongoose.Types.ObjectId;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
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
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: ['Applied', 'Screening', 'Interview', 'Submitted', 'Offer', 'Hired', 'Rejected'],
      default: 'Applied',
    },
    aiAnalysisId: {
      type: Schema.Types.ObjectId,
      ref: 'AIAnalysis',
    },
    notes: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ organizationId: 1, stage: 1 });
applicationSchema.index({ jobId: 1, organizationId: 1 });

applicationSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
