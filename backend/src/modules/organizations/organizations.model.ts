import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganizationSettings {
  subscriptionPlan: string;
  maxUsers: number;
  features: string[];
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  settings: IOrganizationSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    settings: {
      subscriptionPlan: { type: String, default: 'free' },
      maxUsers: { type: Number, default: 10 },
      features: [{ type: String }],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

organizationSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Organization = mongoose.model<IOrganization>(
  'Organization',
  organizationSchema,
);
