import { AppError } from '../../lib/AppError';
import { Application } from './applications.model';
import { Job } from '../jobs/jobs.model';
import { Candidate } from '../candidates/candidates.model';
import { Resume } from '../resumes/resumes.model';
import { uploadToS3 } from '../../lib/s3';
import { extractResumeText, parseResumeTextToCandidateData } from '../resumes/resumes.service';

async function savePublicResume(file: Express.Multer.File, orgId: string, candidateId: string) {
  const { url } = await uploadToS3(file, orgId);

  const resume = await Resume.create({
    organizationId: orgId,
    candidateId,
    fileName: file.originalname,
    filePath: url,
    mimeType: file.mimetype,
    fileSize: file.size,
  });

  await Candidate.findByIdAndUpdate(candidateId, {
    $addToSet: { resumeIds: resume._id },
  });

  try {
    const rawText = await extractResumeText(file.buffer, file.mimetype);
    const parsed = parseResumeTextToCandidateData(rawText);

    const update: Record<string, unknown> = {};
    if (parsed.summary) update.summary = parsed.summary;
    if (parsed.workHistory.length > 0) update.workHistory = parsed.workHistory;
    if (parsed.education.length > 0) update.education = parsed.education;
    if (parsed.fullName) update.fullName = parsed.fullName;

    await Candidate.findByIdAndUpdate(candidateId, {
      $set: update,
      $addToSet: { skills: { $each: parsed.skills } },
    });

    await Resume.findByIdAndUpdate(resume._id, {
      $set: {
        rawText: rawText.substring(0, 5000),
        parsedData: {
          fullName: parsed.fullName,
          email: parsed.email,
          phone: parsed.phone,
          skills: parsed.skills,
          summary: parsed.summary,
          workHistory: parsed.workHistory,
          education: parsed.education,
        },
      },
    });
  } catch {
    // resume parsing is best-effort; continue even if it fails
  }

  return resume.toJSON();
}

export async function publicApply(data: {
  jobId: string;
  fullName: string;
  email: string;
  phone?: string;
}, file?: Express.Multer.File) {
  const job = await Job.findById(data.jobId);
  if (!job || job.status !== 'open') {
    throw new AppError('Job not found or no longer accepting applications', 404);
  }

  const existingCandidate = await Candidate.findOne({
    email: data.email.toLowerCase(),
    organizationId: job.organizationId,
  });

  let candidateId: string;
  if (existingCandidate) {
    candidateId = existingCandidate._id.toString();
  } else {
    const candidate = await Candidate.create({
      organizationId: job.organizationId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      createdBy: job.createdBy,
    });
    candidateId = candidate._id.toString();
  }

  if (file) {
    await savePublicResume(file, job.organizationId.toString(), candidateId);
  }

  const existingApplication = await Application.findOne({
    candidateId,
    jobId: data.jobId,
  });

  if (existingApplication) {
    throw new AppError('You have already applied to this job', 409);
  }

  const application = await Application.create({
    organizationId: job.organizationId,
    candidateId,
    jobId: data.jobId,
    createdBy: job.createdBy,
  });

  return application.toJSON();
}

export async function createApplication(
  data: { candidateId: string; jobId: string },
  userId: string,
  orgId: string,
) {
  const existing = await Application.findOne({
    candidateId: data.candidateId,
    jobId: data.jobId,
    organizationId: orgId,
  });

  if (existing) {
    throw new AppError('Candidate already applied to this job', 409);
  }

  const application = await Application.create({
    organizationId: orgId,
    candidateId: data.candidateId,
    jobId: data.jobId,
    createdBy: userId,
  });

  return application.toJSON();
}

export async function updateStage(orgId: string, applicationId: string, stage: string) {
  const application = await Application.findOneAndUpdate(
    { _id: applicationId, organizationId: orgId },
    { $set: { stage } },
    { new: true, runValidators: true },
  );

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  return application.toJSON();
}

export async function getApplicationsForJob(orgId: string, jobId: string) {
  const applications = await Application.find({ jobId, organizationId: orgId })
    .populate('candidateId', 'fullName email skills')
    .populate('aiAnalysisId')
    .sort({ createdAt: -1 });

  return applications.map((a) => {
    const json = a.toJSON() as Record<string, any>;
    if (json.candidateId && typeof json.candidateId === 'object') {
      json.candidate = json.candidateId;
      json.candidateId = json.candidate._id.toString();
    }
    return json;
  });
}

export async function getApplicationsForCandidate(orgId: string, candidateId: string) {
  const applications = await Application.find({ candidateId, organizationId: orgId })
    .populate('jobId', 'title companyName')
    .populate('aiAnalysisId')
    .sort({ createdAt: -1 });

  return applications.map((a) => {
    const json = a.toJSON() as Record<string, any>;
    if (json.jobId && typeof json.jobId === 'object') {
      json.job = json.jobId;
      json.jobId = json.job._id.toString();
    }
    return json;
  });
}

export async function getApplicationById(orgId: string, applicationId: string) {
  const application = await Application.findOne({ _id: applicationId, organizationId: orgId })
    .populate('candidateId')
    .populate('jobId')
    .populate('aiAnalysisId')
    .populate('createdBy', 'name');

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const json = application.toJSON() as Record<string, any>;
  if (json.jobId && typeof json.jobId === 'object') {
    json.job = json.jobId;
    json.jobId = json.job._id.toString();
  }
  if (json.candidateId && typeof json.candidateId === 'object') {
    json.candidate = json.candidateId;
    json.candidateId = json.candidate._id.toString();
  }
  return json;
}

export async function deleteApplication(orgId: string, applicationId: string) {
  const application = await Application.findOneAndDelete({
    _id: applicationId,
    organizationId: orgId,
  });

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  return { message: 'Application deleted successfully' };
}

export async function getStageDistribution(orgId: string) {
  const distribution = await Application.aggregate([
    { $match: { organizationId: orgId as any } },
    { $group: { _id: '$stage', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const stages = ['Applied', 'Screening', 'Interview', 'Submitted', 'Offer', 'Hired', 'Rejected'];
  const result: Record<string, number> = {};
  for (const stage of stages) {
    result[stage] = 0;
  }
  for (const item of distribution) {
    result[item._id] = item.count;
  }

  return result;
}
