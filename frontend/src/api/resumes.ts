import api from '@/lib/axios';
import type { Resume, ApiResponse } from '@/types';

export async function uploadResume(
  file: File,
  candidateId: string,
): Promise<Resume> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('candidateId', candidateId);
  const res = await api.post<ApiResponse<Resume>>('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function getResume(id: string): Promise<Resume> {
  const res = await api.get<ApiResponse<Resume>>(`/resumes/${id}`);
  return res.data.data;
}
