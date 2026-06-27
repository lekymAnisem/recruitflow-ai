import { AppError } from '../../lib/AppError';
import { Organization } from './organizations.model';

export async function findById(organizationId: string) {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }
  return organization.toJSON();
}

export async function updateSettings(
  organizationId: string,
  settings: {
    subscriptionPlan?: string;
    maxUsers?: number;
    features?: string[];
  },
) {
  const organization = await Organization.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  if (settings.subscriptionPlan !== undefined) {
    organization.settings.subscriptionPlan = settings.subscriptionPlan;
  }
  if (settings.maxUsers !== undefined) {
    organization.settings.maxUsers = settings.maxUsers;
  }
  if (settings.features !== undefined) {
    organization.settings.features = settings.features;
  }

  await organization.save();
  return organization.toJSON();
}

export async function getCurrentOrganization(userId: string) {
  const organization = await Organization.findOne({ createdBy: userId });
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }
  return organization.toJSON();
}
