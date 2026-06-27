import mongoose, { Schema, Document } from 'mongoose';

export interface IAIAnalysis extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  possibleConcerns: string[];
  recruiterSummary: string;
  suggestedInterviewQuestions: string[];
  rawModelResponse: string;
  modelVersion: string;
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

const aiAnalysisSchema = new Schema<IAIAnalysis>(
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
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    strengths: [{ type: String }],
    missingSkills: [{ type: String }],
    possibleConcerns: [{ type: String }],
    recruiterSummary: { type: String },
    suggestedInterviewQuestions: [{ type: String }],
    rawModelResponse: { type: String },
    modelVersion: { type: String, default: 'gpt-4o-mini' },
    processingTime: { type: Number, default: 0 },
  },
  { timestamps: true },
);

aiAnalysisSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
aiAnalysisSchema.index({ organizationId: 1, matchScore: -1 });

aiAnalysisSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const AIAnalysis = mongoose.model<IAIAnalysis>('AIAnalysis', aiAnalysisSchema);
