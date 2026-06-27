import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  companyName: z.string().min(1, 'Company name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  requiredSkills: z.array(z.string()).default([]),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']),
  location: z.string().optional(),
  salaryRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.string().default('USD'),
    })
    .optional(),
  status: z.enum(['open', 'closed', 'archived']).default('open'),
});

export const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  companyName: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  requiredSkills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'temporary']).optional(),
  location: z.string().optional(),
  salaryRange: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
      currency: z.string().optional(),
    })
    .optional(),
  status: z.enum(['open', 'closed', 'archived']).optional(),
});
