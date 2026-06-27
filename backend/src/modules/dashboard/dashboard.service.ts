import mongoose from 'mongoose';
import { Job } from '../jobs/jobs.model';
import { Candidate } from '../candidates/candidates.model';
import { Application } from '../applications/applications.model';
import { AIAnalysis } from '../ai/ai.model';

export async function getSummary(orgId: string) {
  const orgObjectId = new mongoose.Types.ObjectId(orgId);

  const [
    totalJobs,
    totalCandidates,
    activeApplications,
    candidatesByStage,
    recentCandidates,
    recentAnalyses,
    topMatches,
  ] = await Promise.all([
    Job.countDocuments({ organizationId: orgId, status: 'open' }),
    Candidate.countDocuments({ organizationId: orgId }),
    Application.countDocuments({
      organizationId: orgId,
      stage: { $nin: ['Hired', 'Rejected'] },
    }),
    Application.aggregate([
      { $match: { organizationId: orgObjectId } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Candidate.find({ organizationId: orgId })
      .select('fullName email skills createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    AIAnalysis.find({ organizationId: orgId })
      .populate('candidateId', 'fullName')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    AIAnalysis.find({ organizationId: orgId, matchScore: { $gte: 70 } })
      .populate('candidateId', 'fullName email skills')
      .populate('jobId', 'title')
      .sort({ matchScore: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    totalJobs,
    totalCandidates,
    activeApplications,
    candidatesByStage,
    recentCandidates,
    recentAnalyses,
    topMatches,
  };
}
