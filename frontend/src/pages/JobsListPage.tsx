import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getJobs, deleteJob } from '@/api/jobs';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { JobFormModal } from '@/features/jobs/JobFormModal';
import type { Job, PaginatedResponse } from '@/types';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' },
];

const experienceLabels: Record<string, string> = {
  entry: 'Entry',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
};

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        </td>
      ))}
    </tr>
  );
}

function SkeletonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {[...Array(1)].map((_, i) => (
            <tr key={i}>
              {[...Array(7)].map((_, j) => (
                <th key={j} className="px-6 py-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <p className="text-sm text-gray-500">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
        {total} jobs
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 || p === totalPages || Math.abs(p - page) <= 2,
          )
          .map((p, idx, arr) => (
            <span key={p} className="flex items-center">
              {idx > 0 && arr[idx - 1] !== p - 1 && (
                <span className="px-1 text-gray-400">...</span>
              )}
              <Button
                variant={p === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            </span>
          ))}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export default function JobsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const handleSearch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (val: string) => {
        setSearch(val);
        clearTimeout(timer);
        timer = setTimeout(() => {
          setDebouncedSearch(val);
          setPage(1);
        }, 300);
      };
    })(),
    [],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['jobs', page, debouncedSearch, statusFilter],
    queryFn: () =>
      getJobs({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete job');
    },
  });

  const handleDelete = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${job.title}" at ${job.companyName}?`)) {
      deleteMutation.mutate(job._id);
    }
  };

  const handleEdit = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    setEditingJob(job);
  };

  const renderStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      draft: 'default',
      open: 'success',
      closed: 'danger',
      filled: 'info',
    };
    return (
      <Badge variant={variantMap[status] || 'default'} size="sm">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <SkeletonTable />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <Briefcase className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Failed to load jobs
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {(error as Error)?.message || 'Something went wrong'}
        </p>
        <Button variant="primary" size="sm" className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const paginatedData = data as PaginatedResponse<Job> | undefined;
  const jobs = paginatedData?.data || [];
  const total = paginatedData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your job openings and track candidates
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title="No jobs found"
              description={
                debouncedSearch || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first job posting'
              }
              action={
                !debouncedSearch && !statusFilter
                  ? {
                      label: 'Create Job',
                      onClick: () => setIsCreateModalOpen(true),
                    }
                  : undefined
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Candidates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {jobs.map((job) => (
                  <tr
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {job.title}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm text-gray-700">{job.companyName}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {renderStatusBadge(job.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {experienceLabels[job.experienceLevel] ||
                          job.experienceLevel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        --
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(job.createdAt)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleEdit(e, job)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, job)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={total}
            limit={10}
            onPageChange={setPage}
          />
        </Card>
      )}

      <JobFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <JobFormModal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        job={editingJob}
      />
    </div>
  );
}
