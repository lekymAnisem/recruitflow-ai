import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { createCandidate, updateCandidate } from '@/api/candidates';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { Candidate } from '@/types';

const workHistorySchema = z.object({
  company: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().min(1, 'Field is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

const candidateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  summary: z.string().optional(),
  skills: z.string().optional(),
  workHistory: z.array(workHistorySchema).optional(),
  education: z.array(educationSchema).optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
}

export function CandidateFormModal({ isOpen, onClose, candidate }: CandidateFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!candidate;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedinUrl: '',
      githubUrl: '',
      yearsOfExperience: undefined,
      summary: '',
      skills: '',
      workHistory: [],
      education: [],
    },
  });

  const {
    fields: workFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({ control, name: 'workHistory' });

  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control, name: 'education' });

  useEffect(() => {
    if (candidate) {
      reset({
        fullName: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone || '',
        location: candidate.location || '',
        linkedinUrl: candidate.linkedinUrl || '',
        githubUrl: candidate.githubUrl || '',
        yearsOfExperience: candidate.yearsOfExperience,
        summary: candidate.summary || '',
        skills: candidate.skills.join(', '),
        workHistory: candidate.workHistory || [],
        education: candidate.education || [],
      });
    } else {
      reset({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedinUrl: '',
        githubUrl: '',
        yearsOfExperience: undefined,
        summary: '',
        skills: '',
        workHistory: [],
        education: [],
      });
    }
  }, [candidate, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Candidate>) => createCandidate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate created successfully');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create candidate');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      updateCandidate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', candidate?._id] });
      toast.success('Candidate updated successfully');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update candidate');
    },
  });

  const onSubmit = (values: CandidateFormValues) => {
    const payload: Partial<Candidate> = {
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      location: values.location || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      githubUrl: values.githubUrl || undefined,
      yearsOfExperience: values.yearsOfExperience || undefined,
      summary: values.summary || undefined,
      skills: values.skills
        ? values.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      workHistory: values.workHistory || [],
      education: values.education || [],
    };

    if (isEditing && candidate) {
      updateMutation.mutate({ id: candidate._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Candidate' : 'Create Candidate'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Email"
            placeholder="e.g. john@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="e.g. +1 (555) 123-4567"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Location"
            placeholder="e.g. San Francisco, CA"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="LinkedIn URL"
            placeholder="e.g. https://linkedin.com/in/johndoe"
            error={errors.linkedinUrl?.message}
            {...register('linkedinUrl')}
          />
          <Input
            label="GitHub URL"
            placeholder="e.g. https://github.com/johndoe"
            error={errors.githubUrl?.message}
            {...register('githubUrl')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Years of Experience"
            type="number"
            min={0}
            placeholder="e.g. 5"
            error={errors.yearsOfExperience?.message}
            {...register('yearsOfExperience')}
          />
        </div>

        <Textarea
          label="Summary"
          placeholder="Brief professional summary..."
          error={errors.summary?.message}
          {...register('summary')}
        />

        <Input
          label="Skills"
          placeholder="e.g. React, TypeScript, Node.js"
          error={errors.skills?.message}
          {...register('skills')}
        />

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Work History</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendWork({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {workFields.map((field, index) => (
            <div key={field.id} className="mb-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Experience #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeWork(index)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Company"
                  placeholder="e.g. Acme Corp"
                  error={errors.workHistory?.[index]?.company?.message}
                  {...register(`workHistory.${index}.company`)}
                />
                <Input
                  label="Title"
                  placeholder="e.g. Senior Engineer"
                  error={errors.workHistory?.[index]?.title?.message}
                  {...register(`workHistory.${index}.title`)}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Input
                  label="Start Date"
                  type="date"
                  error={errors.workHistory?.[index]?.startDate?.message}
                  {...register(`workHistory.${index}.startDate`)}
                />
                <Input
                  label="End Date"
                  type="date"
                  error={errors.workHistory?.[index]?.endDate?.message}
                  {...register(`workHistory.${index}.endDate`)}
                />
                <label className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    {...register(`workHistory.${index}.current`)}
                  />
                  <span className="text-sm text-gray-700">Current</span>
                </label>
              </div>
              <div className="mt-3">
                <Textarea
                  label="Description"
                  placeholder="Describe responsibilities..."
                  {...register(`workHistory.${index}.description`)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Education</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendEdu({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {eduFields.map((field, index) => (
            <div key={field.id} className="mb-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Education #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeEdu(index)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Institution"
                  placeholder="e.g. Stanford University"
                  error={errors.education?.[index]?.institution?.message}
                  {...register(`education.${index}.institution`)}
                />
                <Input
                  label="Degree"
                  placeholder="e.g. Bachelor of Science"
                  error={errors.education?.[index]?.degree?.message}
                  {...register(`education.${index}.degree`)}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Input
                  label="Field of Study"
                  placeholder="e.g. Computer Science"
                  error={errors.education?.[index]?.fieldOfStudy?.message}
                  {...register(`education.${index}.fieldOfStudy`)}
                />
                <Input
                  label="Start Year"
                  type="date"
                  error={errors.education?.[index]?.startDate?.message}
                  {...register(`education.${index}.startDate`)}
                />
                <Input
                  label="End Year"
                  type="date"
                  error={errors.education?.[index]?.endDate?.message}
                  {...register(`education.${index}.endDate`)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isMutating}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isMutating}>
            {isEditing ? 'Update Candidate' : 'Create Candidate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
