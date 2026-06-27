import { z } from 'zod';

export const resumeUploadSchema = z.object({
  file: z
    .object({
      mimetype: z.enum([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]),
      size: z.number().max(10 * 1024 * 1024, 'File size must be under 10MB'),
    })
    .refine((f) => f, 'File is required'),
});
