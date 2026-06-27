import bcrypt from 'bcryptjs';
import { AppError } from '../../lib/AppError';
import { User } from './users.model';

export async function createUser(data: {
  organizationId: string;
  name: string;
  email: string;
  password: string;
  role?: 'recruiter';
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    organizationId: data.organizationId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role || 'recruiter',
  });

  return user.toJSON();
}

export async function findAllByOrganization(organizationId: string) {
  const users = await User.find({ organizationId }).sort({ createdAt: -1 });
  return users.map((u) => u.toJSON());
}

export async function findById(userId: string, organizationId: string) {
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
}

export async function updateUser(
  userId: string,
  organizationId: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    isActive?: boolean;
  },
) {
  const user = await User.findOne({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.isActive !== undefined) user.isActive = data.isActive;

  if (data.password) {
    user.passwordHash = await bcrypt.hash(data.password, 12);
  }

  await user.save();
  return user.toJSON();
}

export async function deleteUser(userId: string, organizationId: string) {
  const user = await User.findOneAndDelete({ _id: userId, organizationId });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return { message: 'User deleted successfully' };
}
