import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true },
);

tagSchema.index({ organizationId: 1, name: 1 }, { unique: true });

tagSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
