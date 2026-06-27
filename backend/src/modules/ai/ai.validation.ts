import { z } from 'zod';

export const analyzeSchema = z.object({
  candidateId: z.string({
    required_error: 'candidateId is required',
  }),
  jobId: z.string({
    required_error: 'jobId is required',
  }),
});

export const generateQuestionsSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
});

export const generateSummarySchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
});
