import mongoose, { Schema, Document } from 'mongoose';

export interface INote extends Document {
  organizationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
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
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

noteSchema.index({ candidateId: 1, organizationId: 1 });

noteSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Note = mongoose.model<INote>('Note', noteSchema);
