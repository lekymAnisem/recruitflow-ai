import { z } from 'zod';

export const createApplicationSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
});

export const publicApplySchema = z.object({
  jobId: z.string(),
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum([
    'Applied',
    'Screening',
    'Interview',
    'Submitted',
    'Offer',
    'Hired',
    'Rejected',
  ]),
});
