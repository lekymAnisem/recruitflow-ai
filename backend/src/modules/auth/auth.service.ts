import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../../lib/AppError';
import { User } from '../users/users.model';
import { Organization } from '../organizations/organizations.model';
import { RefreshToken } from './auth.model';
import { TokenPayload, AuthTokens } from './auth.types';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateTokens(user: {
  _id: string;
  email: string;
  role: string;
  organizationId?: string;
}): Promise<AuthTokens> {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organizationId || '',
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry as SignOptions['expiresIn'],
    issuer: config.jwtIssuer,
  });

  const refreshToken = jwt.sign(
    { userId: user._id.toString() },
    config.jwtSecret,
    {
      expiresIn: config.jwtRefreshExpiry as SignOptions['expiresIn'],
      issuer: config.jwtIssuer,
    },
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const slug = generateSlug(data.organizationName);
  const existingOrg = await Organization.findOne({ slug });
  if (existingOrg) {
    throw new AppError('Organization with this name already exists', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const organization = await Organization.create({
    name: data.organizationName,
    slug,
  });

  const user = await User.create({
    organizationId: organization._id,
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'owner',
  });

  organization.createdBy = user._id;
  await organization.save();

  const tokens = await generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: organization._id.toString(),
  });

  const userObj = user.toJSON();

  return { user: userObj, tokens };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organizationId.toString(),
  });

  const userObj = user.toJSON();

  return { user: userObj, tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  let decoded: { userId: string };
  try {
    decoded = jwt.verify(refreshToken, config.jwtSecret, {
      issuer: config.jwtIssuer,
    }) as { userId: string };
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedToken = await RefreshToken.findOneAndDelete({ token: refreshToken });
  if (!storedToken) {
    throw new AppError('Refresh token has been revoked', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError('Refresh token has expired', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  const tokens = await generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: user.organizationId.toString(),
  });

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export async function logout(refreshToken: string) {
  await RefreshToken.findOneAndDelete({ token: refreshToken });
}

export async function registerCandidate(data: {
  name: string;
  email: string;
  password: string;
}) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    role: 'candidate',
  });

  const tokens = await generateTokens({
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  const userObj = user.toJSON();

  return { user: userObj, tokens };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
}
