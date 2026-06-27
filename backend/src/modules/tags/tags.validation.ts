import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().optional(),
});

export const addTagToCandidateSchema = z.object({
  tagId: z.string(),
});
