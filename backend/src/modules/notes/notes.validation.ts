import { z } from 'zod';

export const createNoteSchema = z.object({
  candidateId: z.string(),
  content: z.string().min(1, 'Content is required'),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});
