import api from '@/lib/axios';
import type { Application, ApiResponse } from '@/types';

export interface CreateApplicationData {
  candidateId: string;
  jobId: string;
}

export async function createApplication(
  data: CreateApplicationData,
): Promise<Application> {
  const res = await api.post<ApiResponse<Application>>('/applications', data);
  return res.data.data;
}

export async function updateStage(
  id: string,
  stage: Application['stage'],
): Promise<Application> {
  const res = await api.put<ApiResponse<Application>>(
    `/applications/${id}/stage`,
    { stage },
  );
  return res.data.data;
}

export async function getJobApplications(jobId: string) {
  const res = await api.get(`/applications/job/${jobId}`);
  return res.data.data;
}

export async function publicApply(formData: FormData) {
  const res = await api.post('/applications/public', formData);
  return res.data.data;
}

export async function getCandidateApplications(candidateId: string) {
  const res = await api.get(`/applications/candidate/${candidateId}`);
  return res.data.data;
}
