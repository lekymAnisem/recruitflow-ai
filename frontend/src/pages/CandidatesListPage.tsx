import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Upload,
  Search,
  Edit3,
  Trash2,
  Eye,
  Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCandidates, deleteCandidate } from '@/api/candidates';
import { getTags } from '@/api/tags';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { CandidateFormModal } from '@/features/candidates/CandidateFormModal';
import { UploadResumeModal } from '@/features/candidates/UploadResumeModal';
import type { Candidate, Tag, PaginatedResponse } from '@/types';

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
          <tr>
            {[...Array(7)].map((_, j) => (
              <th key={j} className="px-6 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              </th>
            ))}
          </tr>
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
        {total} candidates
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
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
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

export default function CandidatesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

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
    queryKey: ['candidates', page, debouncedSearch],
    queryFn: () =>
      getCandidates({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
      }),
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete candidate');
    },
  });

  const handleDelete = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${candidate.fullName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(candidate._id);
    }
  };

  const handleEdit = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    setEditingCandidate(candidate);
  };

  const handleView = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    navigate(`/candidates/${candidate._id}`);
  };

  const tags = (tagsData || []) as Tag[];

  const getTagName = (tagId: string): Tag | undefined =>
    tags.find((t) => t._id === tagId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
        <SkeletonTable />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <Users className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load candidates</h3>
        <p className="mt-1 text-sm text-gray-500">
          {(error as Error)?.message || 'Something went wrong'}
        </p>
        <Button variant="primary" size="sm" className="mt-6" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  const paginatedData = data as PaginatedResponse<Candidate> | undefined;
  const candidates = paginatedData?.data || [];
  const total = paginatedData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your candidate pipeline and resumes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4" />
            Upload Resume
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          placeholder="Search by name, email, or skills..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No candidates found"
              description={
                debouncedSearch
                  ? 'Try adjusting your search'
                  : 'Get started by adding a candidate or uploading a resume'
              }
              action={
                !debouncedSearch
                  ? {
                      label: 'Add Candidate',
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Linked Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {candidates.map((candidate) => (
                  <tr
                    key={candidate._id}
                    onClick={() => navigate(`/candidates/${candidate._id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          {candidate.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {candidate.fullName}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {candidate.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="info" size="sm">
                            {skill}
                          </Badge>
                        ))}
                        {candidate.skills.length > 3 && (
                          <Badge variant="default" size="sm">
                            +{candidate.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {candidate.tagIds.slice(0, 3).map((tagId) => {
                          const tag = getTagName(tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: tag.color + '20',
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                        <Briefcase className="h-3.5 w-3.5" />
                        --
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(candidate.updatedAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleView(e, candidate)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleEdit(e, candidate)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary-600"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, candidate)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
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

      <CandidateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <CandidateFormModal
        isOpen={!!editingCandidate}
        onClose={() => setEditingCandidate(null)}
        candidate={editingCandidate}
      />
      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
