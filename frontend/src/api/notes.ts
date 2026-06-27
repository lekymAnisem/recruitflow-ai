import api from '@/lib/axios';
import type { CandidateNote, ApiResponse } from '@/types';

export interface CreateNoteData {
  candidateId: string;
  content: string;
}

export async function getCandidateNotes(candidateId: string) {
  const res = await api.get(`/notes/candidate/${candidateId}`);
  return res.data.data;
}

export async function createNote(
  data: CreateNoteData,
): Promise<CandidateNote> {
  const res = await api.post<ApiResponse<CandidateNote>>('/notes', data);
  return res.data.data;
}

export async function updateNote(
  id: string,
  content: string,
): Promise<CandidateNote> {
  const res = await api.put<ApiResponse<CandidateNote>>(`/notes/${id}`, {
    content,
  });
  return res.data.data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}
