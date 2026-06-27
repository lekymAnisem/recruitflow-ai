import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createJob, updateJob } from '@/api/jobs';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { Job } from '@/types';

const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  description: z.string().min(1, 'Description is required'),
  requiredSkills: z.string().min(1, 'At least one skill is required'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']),
  location: z.string().min(1, 'Location is required'),
  salaryMin: z.coerce.number().min(0, 'Must be positive'),
  salaryMax: z.coerce.number().min(0, 'Must be positive'),
  status: z.enum(['draft', 'open', 'closed', 'filled']).optional(),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
}

export function JobFormModal({ isOpen, onClose, job }: JobFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!job;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      companyName: '',
      description: '',
      requiredSkills: '',
      experienceLevel: 'mid',
      employmentType: 'full-time',
      location: '',
      salaryMin: 0,
      salaryMax: 0,
      status: 'open',
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        companyName: job.companyName,
        description: job.description,
        requiredSkills: job.requiredSkills.join(', '),
        experienceLevel: job.experienceLevel,
        employmentType: job.employmentType,
        location: job.location,
        salaryMin: job.salaryRange.min,
        salaryMax: job.salaryRange.max,
        status: job.status,
      });
    } else {
      reset({
        title: '',
        companyName: '',
        description: '',
        requiredSkills: '',
        experienceLevel: 'mid',
        employmentType: 'full-time',
        location: '',
        salaryMin: 0,
        salaryMax: 0,
        status: 'open',
      });
    }
  }, [job, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Job>) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created successfully');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create job');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
      updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update job');
    },
  });

  const onSubmit = async (values: JobFormValues) => {
    const payload: Partial<Job> = {
      title: values.title,
      companyName: values.companyName,
      description: values.description,
      requiredSkills: values.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      experienceLevel: values.experienceLevel,
      employmentType: values.employmentType,
      location: values.location,
      salaryRange: {
        min: values.salaryMin,
        max: values.salaryMax,
        currency: 'USD',
      },
    };

    if (isEditing && values.status) {
      payload.status = values.status;
    }

    if (isEditing && job) {
      updateMutation.mutate({ id: job._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Job' : 'Create Job'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            placeholder="e.g. Senior Frontend Engineer"
            error={errors.title?.message}
            {...register('title')}
          />
          <Input
            label="Company Name"
            placeholder="e.g. Acme Corp"
            error={errors.companyName?.message}
            {...register('companyName')}
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Describe the role and responsibilities..."
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          label="Required Skills"
          placeholder="e.g. React, TypeScript, Node.js"
          error={errors.requiredSkills?.message}
          {...register('requiredSkills')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <Select
                label="Experience Level"
                options={[
                  { value: 'entry', label: 'Entry' },
                  { value: 'mid', label: 'Mid' },
                  { value: 'senior', label: 'Senior' },
                  { value: 'lead', label: 'Lead' },
                ]}
                error={errors.experienceLevel?.message}
                {...field}
              />
            )}
          />
          <Controller
            name="employmentType"
            control={control}
            render={({ field }) => (
              <Select
                label="Employment Type"
                options={[
                  { value: 'full-time', label: 'Full Time' },
                  { value: 'part-time', label: 'Part Time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'temporary', label: 'Temporary' },
                  { value: 'internship', label: 'Internship' },
                ]}
                error={errors.employmentType?.message}
                {...field}
              />
            )}
          />
        </div>

        <Input
          label="Location"
          placeholder="e.g. San Francisco, CA (Remote)"
          error={errors.location?.message}
          {...register('location')}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Salary Min ($)"
            type="number"
            error={errors.salaryMin?.message}
            {...register('salaryMin')}
          />
          <Input
            label="Salary Max ($)"
            type="number"
            error={errors.salaryMax?.message}
            {...register('salaryMax')}
          />
          {isEditing && (
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'open', label: 'Open' },
                    { value: 'closed', label: 'Closed' },
                    { value: 'filled', label: 'Filled' },
                  ]}
                  error={errors.status?.message}
                  {...field}
                />
              )}
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isMutating}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isMutating}>
            {isEditing ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
