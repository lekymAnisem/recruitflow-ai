import mongoose, { Model } from 'mongoose';
import { AppError } from '../../lib/AppError';
import { Job } from './jobs.model';

interface JobFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

let ApplicationModel: Model<any> | null = null;

function getApplicationModel(): Model<any> {
  if (ApplicationModel) return ApplicationModel;
  if (mongoose.models.Application) {
    ApplicationModel = mongoose.model('Application');
    return ApplicationModel;
  }
  const applicationSchema = new mongoose.Schema(
    {
      jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
      organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
      status: { type: String, default: 'new' },
    },
    { timestamps: true },
  );
  ApplicationModel = mongoose.model('Application', applicationSchema);
  return ApplicationModel;
}

export async function getAllPublicJobs(
  filters?: JobFilters,
): Promise<{
  data: Record<string, any>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { status: 'open' };

  if (filters?.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { companyName: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return {
    data: jobs.map((j) => j.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPublicJobById(
  jobId: string,
): Promise<Record<string, any>> {
  const job = await Job.findOne({ _id: jobId, status: 'open' });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return job.toJSON();
}

export async function createJob(
  data: {
    title: string;
    companyName: string;
    description: string;
    requiredSkills?: string[];
    experienceLevel: string;
    employmentType: string;
    location?: string;
    salaryRange?: { min?: number; max?: number; currency?: string };
    status?: string;
  },
  userId: string,
  orgId: string,
) {
  const job = await Job.create({
    organizationId: orgId,
    createdBy: userId,
    ...data,
  });
  return job.toJSON();
}

export async function getAllJobs(
  orgId: string,
  filters?: JobFilters,
): Promise<{
  data: Record<string, any>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { organizationId: orgId };

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { companyName: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(query),
  ]);

  return {
    data: jobs.map((j) => j.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getJobById(
  orgId: string,
  jobId: string,
): Promise<Record<string, any>> {
  const job = await Job.findOne({ _id: jobId, organizationId: orgId })
    .populate('createdBy', 'name');

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const Application = getApplicationModel();
  const candidateCount = await Application.countDocuments({ jobId, organizationId: orgId });

  const result = job.toJSON() as Record<string, any>;
  result.candidateCount = candidateCount;
  return result;
}

export async function updateJob(
  orgId: string,
  jobId: string,
  data: Record<string, any>,
) {
  const job = await Job.findOneAndUpdate(
    { _id: jobId, organizationId: orgId },
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  return job.toJSON();
}

export async function deleteJob(orgId: string, jobId: string) {
  const job = await Job.findOneAndDelete({ _id: jobId, organizationId: orgId });

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const Application = getApplicationModel();
  await Application.deleteMany({ jobId, organizationId: orgId });

  return { message: 'Job deleted successfully' };
}

export async function getJobCandidates(orgId: string, jobId: string) {
  const job = await Job.findOne({ _id: jobId, organizationId: orgId });
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const Application = getApplicationModel();
  const applications = await Application.find({ jobId, organizationId: orgId })
    .populate('candidateId')
    .sort({ createdAt: -1 });

  return applications;
}
