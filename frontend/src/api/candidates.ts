import api from '@/lib/axios';
import type { Candidate, ApiResponse, PaginatedResponse } from '@/types';

export interface CandidateParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getCandidates(params?: CandidateParams): Promise<PaginatedResponse<Candidate>> {
  const res = await api.get('/candidates', { params });
  return {
    data: res.data.data || [],
    total: res.data.pagination?.total || 0,
    page: res.data.pagination?.page || 1,
    limit: res.data.pagination?.limit || 10,
  };
}

export async function getCandidate(id: string): Promise<Candidate> {
  const res = await api.get<ApiResponse<Candidate>>(`/candidates/${id}`);
  return res.data.data;
}

export async function createCandidate(
  data: Partial<Candidate>,
): Promise<Candidate> {
  const res = await api.post<ApiResponse<Candidate>>('/candidates', data);
  return res.data.data;
}

export async function updateCandidate(
  id: string,
  data: Partial<Candidate>,
): Promise<Candidate> {
  const res = await api.put<ApiResponse<Candidate>>(
    `/candidates/${id}`,
    data,
  );
  return res.data.data;
}

export async function deleteCandidate(id: string): Promise<void> {
  await api.delete(`/candidates/${id}`);
}
