import api from '@/lib/axios';
import type { AIAnalysis, ApiResponse } from '@/types';

export async function analyzeMatch(
  candidateId: string,
  jobId: string,
): Promise<AIAnalysis> {
  const res = await api.post<ApiResponse<AIAnalysis>>('/ai/candidate-match', {
    candidateId,
    jobId,
  });
  return res.data.data;
}

export async function getCandidateAnalyses(
  candidateId: string,
): Promise<AIAnalysis[]> {
  const res = await api.get<ApiResponse<AIAnalysis[]>>(
    `/ai/candidate/${candidateId}`,
  );
  return res.data.data;
}

export async function getJobAnalyses(jobId: string): Promise<AIAnalysis[]> {
  const res = await api.get<ApiResponse<AIAnalysis[]>>(`/ai/job/${jobId}`);
  return res.data.data;
}

export async function generateInterviewQuestions(
  candidateId: string,
  jobId: string,
): Promise<{ questions: string[] }> {
  const res = await api.post<ApiResponse<{ questions: string[] }>>(
    '/ai/interview-questions',
    { candidateId, jobId },
  );
  return res.data.data;
}

export async function generateRecruiterSummary(
  candidateId: string,
  jobId: string,
): Promise<{ summary: string }> {
  const res = await api.post<ApiResponse<{ summary: string }>>(
    '/ai/recruiter-summary',
    { candidateId, jobId },
  );
  return res.data.data;
}
