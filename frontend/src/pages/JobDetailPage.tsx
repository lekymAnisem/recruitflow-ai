import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ArrowLeft,
  Edit3,
  Archive,
  XCircle,
  UserPlus,
  Users,
  Brain,
  Star,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { getJob, updateJob, getJobCandidates } from '@/api/jobs';
import { getCandidates } from '@/api/candidates';
import { createApplication, updateStage } from '@/api/applications';
import { analyzeMatch } from '@/api/ai';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils';
import { JobFormModal } from '@/features/jobs/JobFormModal';
import type { Job, Candidate, Application, AIAnalysis } from '@/types';

interface CandidateWithApp {
  candidate: Candidate;
  application: Application;
  analysis?: AIAnalysis | null;
}

const stageOptions = [
  { value: 'new', label: 'New' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-700 bg-green-50 border-green-200'
      : score >= 60
        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
        : 'text-red-700 bg-red-50 border-red-200';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-lg font-bold ${color}`}
    >
      <Star className={`h-5 w-5 ${score >= 80 ? 'fill-green-500 text-green-500' : score >= 60 ? 'fill-yellow-500 text-yellow-500' : 'fill-red-500 text-red-500'}`} />
      {score}%
    </span>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-6 w-64 rounded bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="flex gap-4">
            <div className="h-6 w-20 rounded bg-gray-200" />
            <div className="h-6 w-20 rounded bg-gray-200" />
            <div className="h-6 w-20 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const {
    data: job,
    isLoading: jobLoading,
    isError: jobError,
  } = useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id!),
    enabled: !!id,
  });

  const { data: jobCandidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['jobCandidates', id],
    queryFn: () => getJobCandidates(id!),
    enabled: !!id,
  });

  const { data: allCandidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => getCandidates({ limit: 100 }),
    enabled: isAddCandidateModalOpen,
  });

  const updateJobMutation = useMutation({
    mutationFn: (data: Partial<Job>) => updateJob(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job status updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addApplicationMutation = useMutation({
    mutationFn: () =>
      createApplication({ candidateId: selectedCandidateId, jobId: id! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobCandidates', id] });
      toast.success('Candidate added to job');
      setIsAddCandidateModalOpen(false);
      setSelectedCandidateId('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const stageMutation = useMutation({
    mutationFn: ({
      applicationId,
      stage,
    }: {
      applicationId: string;
      stage: Application['stage'];
    }) => updateStage(applicationId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobCandidates', id] });
      toast.success('Stage updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const analyzeMutation = useMutation({
    mutationFn: (candidateId: string) => analyzeMatch(candidateId, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobCandidates', id] });
      toast.success('AI analysis complete');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (jobLoading) return <SkeletonDetail />;

  if (jobError || !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <Briefcase className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Job not found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The job you're looking for doesn't exist or was removed.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/jobs')}
        >
          Back to Jobs
        </Button>
      </div>
    );
  }

  const candidates: CandidateWithApp[] = jobCandidates || [];

  const availableCandidates = (allCandidates?.data || []).filter(
    (c: Candidate) =>
      !candidates.some((ca: CandidateWithApp) => ca.candidate._id === c._id),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
          {job.status === 'open' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateJobMutation.mutate({ status: 'closed' })
              }
            >
              <Archive className="h-4 w-4" />
              Close
            </Button>
          )}
          {job.status !== 'closed' && job.status !== 'filled' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                updateJobMutation.mutate({ status: 'closed' })
              }
            >
              <XCircle className="h-4 w-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-lg text-gray-600">{job.companyName}</p>
            </div>
            <Badge
              variant={
                job.status === 'open'
                  ? 'success'
                  : job.status === 'filled'
                    ? 'info'
                    : job.status === 'draft'
                      ? 'default'
                      : 'danger'
              }
              size="md"
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              {job.employmentType.replace('-', ' ')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
            </span>
            {job.salaryRange.min > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(job.salaryRange.min, job.salaryRange.max)}
              </span>
            )}
            <span className="text-xs text-gray-400">
              Created {formatDate(job.createdAt)}
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Description</h2>
        </CardHeader>
        <CardBody>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {job.description}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            Required Skills
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill) => (
              <Badge key={skill} variant="info" size="md">
                {skill}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Linked Candidates
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddCandidateModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Candidate
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {candidatesLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No candidates linked"
              description="Add candidates to this job to track their progress"
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {candidates.map((ca: CandidateWithApp) => (
                <div key={ca.application._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          {ca.candidate.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {ca.candidate.fullName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ca.candidate.email}
                          </p>
                        </div>
                      </div>
                      {ca.candidate.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ca.candidate.skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} variant="default" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {ca.candidate.skills.length > 6 && (
                            <Badge variant="default" size="sm">
                              +{ca.candidate.skills.length - 6}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-36">
                        <Select
                          options={stageOptions}
                          value={ca.application.stage}
                          onChange={(e) =>
                            stageMutation.mutate({
                              applicationId: ca.application._id,
                              stage: e.target.value as Application['stage'],
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ca.analysis ? (
                        <MatchScoreBadge score={ca.analysis.matchScore} />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeMutation.mutate(ca.candidate._id)}
                          isLoading={analyzeMutation.isPending}
                        >
                          <Brain className="h-4 w-4" />
                          Run AI Analysis
                        </Button>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(ca.application.createdAt)}
                    </span>
                  </div>

                  {ca.analysis && (
                    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          AI Analysis Results
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => analyzeMutation.mutate(ca.candidate._id)}
                          isLoading={analyzeMutation.isPending}
                        >
                          <Brain className="h-3.5 w-3.5" />
                          Re-analyze
                        </Button>
                      </div>

                      {ca.analysis.strengths.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-green-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Strengths
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {ca.analysis.strengths.map((s) => (
                              <Badge key={s} variant="success" size="sm">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {ca.analysis.missingSkills.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-yellow-700 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Missing Skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {ca.analysis.missingSkills.map((s) => (
                              <Badge key={s} variant="warning" size="sm">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {ca.analysis.possibleConcerns &&
                        ca.analysis.possibleConcerns.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-red-700 inline-flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" />
                              Concerns
                            </p>
                            <ul className="list-inside list-disc space-y-0.5 text-sm text-gray-600">
                              {ca.analysis.possibleConcerns.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {ca.analysis.recruiterSummary && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-gray-700 inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            Recruiter Summary
                          </p>
                          <p className="text-sm leading-relaxed text-gray-600">
                            {ca.analysis.recruiterSummary}
                          </p>
                        </div>
                      )}

                      {ca.analysis.suggestedInterviewQuestions &&
                        ca.analysis.suggestedInterviewQuestions.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-blue-700 inline-flex items-center gap-1">
                              <HelpCircle className="h-3.5 w-3.5" />
                              Interview Questions
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                              {ca.analysis.suggestedInterviewQuestions.map(
                                (q, i) => (
                                  <li key={i}>{q}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <JobFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={job}
      />

      <Modal
        isOpen={isAddCandidateModalOpen}
        onClose={() => {
          setIsAddCandidateModalOpen(false);
          setSelectedCandidateId('');
        }}
        title="Add Candidate to Job"
      >
        <div className="space-y-4">
          <Select
            label="Select Candidate"
            placeholder="Choose a candidate..."
            options={availableCandidates.map((c: Candidate) => ({
              value: c._id,
              label: `${c.fullName} (${c.email})`,
            }))}
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
          />
          {availableCandidates.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              All candidates are already linked to this job
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCandidateModalOpen(false);
                setSelectedCandidateId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addApplicationMutation.mutate()}
              disabled={!selectedCandidateId}
              isLoading={addApplicationMutation.isPending}
            >
              Add Candidate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
