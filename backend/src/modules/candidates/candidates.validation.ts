import { z } from 'zod';

const workHistorySchema = z.object({
  company: z.string().optional(),
  title: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().default(false),
});

const educationSchema = z.object({
  institution: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
});

export const createCandidateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0).optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  workHistory: z.array(workHistorySchema).default([]),
  education: z.array(educationSchema).default([]),
  tagIds: z.array(z.string()).default([]),
});

export const updateCandidateSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0).optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  workHistory: z.array(workHistorySchema).optional(),
  education: z.array(educationSchema).optional(),
  tagIds: z.array(z.string()).optional(),
});
