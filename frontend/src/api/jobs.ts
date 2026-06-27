import api from '@/lib/axios';
import type { Job, ApiResponse, PaginatedResponse } from '@/types';

export interface JobParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getJobs(params?: JobParams): Promise<PaginatedResponse<Job>> {
  const res = await api.get('/jobs', { params });
  return {
    data: res.data.data || [],
    total: res.data.pagination?.total || 0,
    page: res.data.pagination?.page || 1,
    limit: res.data.pagination?.limit || 10,
  };
}

export async function getJob(id: string): Promise<Job> {
  const res = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
  return res.data.data;
}

export async function createJob(data: Partial<Job>): Promise<Job> {
  const res = await api.post<ApiResponse<Job>>('/jobs', data);
  return res.data.data;
}

export async function updateJob(
  id: string,
  data: Partial<Job>,
): Promise<Job> {
  const res = await api.put<ApiResponse<Job>>(`/jobs/${id}`, data);
  return res.data.data;
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

export async function getPublicJobs(params?: Omit<JobParams, 'status'>) {
  const res = await api.get('/jobs/public', { params });
  return res.data;
}

export async function getPublicJob(id: string): Promise<Job> {
  const res = await api.get<ApiResponse<Job>>(`/jobs/public/${id}`);
  return res.data.data;
}

export async function getJobCandidates(jobId: string) {
  const res = await api.get(`/jobs/${jobId}/candidates`);
  return res.data.data;
}
