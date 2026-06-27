import api from '@/lib/axios';
import type { Tag, ApiResponse } from '@/types';

export async function getTags(): Promise<Tag[]> {
  const res = await api.get<ApiResponse<Tag[]>>('/tags');
  return res.data.data;
}

export async function createTag(name: string): Promise<Tag> {
  const res = await api.post<ApiResponse<Tag>>('/tags', { name });
  return res.data.data;
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete(`/tags/${id}`);
}

export async function addTagToCandidate(
  candidateId: string,
  tagId: string,
): Promise<void> {
  await api.post(`/tags/candidate/${candidateId}`, { tagId });
}

export async function removeTagFromCandidate(
  candidateId: string,
  tagId: string,
): Promise<void> {
  await api.delete(`/tags/candidate/${candidateId}/${tagId}`);
}
