import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'recruiter' | 'candidate';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['owner', 'recruiter', 'candidate'],
      default: 'recruiter',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform(_doc: any, ret: any) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
