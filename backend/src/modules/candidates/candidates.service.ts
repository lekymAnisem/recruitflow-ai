import mongoose, { Model } from 'mongoose';
import { AppError } from '../../lib/AppError';
import { Candidate } from './candidates.model';

interface CandidateFilters {
  search?: string;
  skills?: string;
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
    },
    { timestamps: true },
  );
  ApplicationModel = mongoose.model('Application', applicationSchema);
  return ApplicationModel;
}

export async function createCandidate(
  data: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    yearsOfExperience?: number;
    summary?: string;
    skills?: string[];
    workHistory?: any[];
    education?: any[];
    tagIds?: string[];
  },
  userId: string,
  orgId: string,
) {
  const candidate = await Candidate.create({
    organizationId: orgId,
    createdBy: userId,
    ...data,
  });
  return candidate.toJSON();
}

export async function getAllCandidates(
  orgId: string,
  filters?: CandidateFilters,
): Promise<{
  data: Record<string, any>[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const skip = (page - 1) * limit;

  const query: Record<string, any> = { organizationId: orgId };

  if (filters?.search) {
    query.$or = [
      { fullName: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { skills: { $regex: filters.search, $options: 'i' } },
    ];
  }

  if (filters?.skills) {
    const skillArray = filters.skills.split(',').map((s) => s.trim());
    query.skills = { $in: skillArray };
  }

  const [candidates, total] = await Promise.all([
    Candidate.find(query)
      .populate('tagIds')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Candidate.countDocuments(query),
  ]);

  return {
    data: candidates.map((c) => c.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCandidateById(
  orgId: string,
  candidateId: string,
): Promise<Record<string, any>> {
  const candidate = await Candidate.findOne({ _id: candidateId, organizationId: orgId })
    .populate('tagIds')
    .populate('createdBy', 'name');

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  const Application = getApplicationModel();
  const applications = await Application.find({ candidateId, organizationId: orgId })
    .populate('jobId', 'title companyName status')
    .sort({ createdAt: -1 });

  const result = candidate.toJSON() as Record<string, any>;
  result.applications = applications.map((a: any) => {
    const json = a.toJSON ? a.toJSON() : a;
    if (json.jobId && typeof json.jobId === 'object') {
      json.job = json.jobId;
      json.jobId = json.job._id.toString();
    }
    return json;
  });
  return result;
}

export async function updateCandidate(
  orgId: string,
  candidateId: string,
  data: Record<string, any>,
) {
  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, organizationId: orgId },
    { $set: data },
    { new: true, runValidators: true },
  );

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  return candidate.toJSON();
}

export async function deleteCandidate(orgId: string, candidateId: string) {
  const candidate = await Candidate.findOneAndDelete({ _id: candidateId, organizationId: orgId });

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  const Application = getApplicationModel();
  await Application.deleteMany({ candidateId, organizationId: orgId });

  return { message: 'Candidate deleted successfully' };
}

export async function searchCandidates(orgId: string, query: string) {
  const candidates = await Candidate.find({
    organizationId: orgId,
    $or: [
      { fullName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { skills: { $regex: query, $options: 'i' } },
    ],
  })
    .populate('tagIds')
    .limit(50)
    .sort({ createdAt: -1 });

  return candidates.map((c) => c.toJSON());
}
