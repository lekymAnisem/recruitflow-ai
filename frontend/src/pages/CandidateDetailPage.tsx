import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  FileText,
  Star,
  Brain,
  Plus,
  Trash2,
  Edit3,
  X,
  ExternalLink,
  Download,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CheckCircle2,
  Tags,
} from 'lucide-react';
import { getCandidate } from '@/api/candidates';
import {
  getCandidateNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/api/notes';
import { getCandidateApplications, createApplication } from '@/api/applications';
import {
  getCandidateAnalyses,
  analyzeMatch,
  generateInterviewQuestions,
} from '@/api/ai';
import { getTags, addTagToCandidate, removeTagFromCandidate } from '@/api/tags';
import { getJobs } from '@/api/jobs';
import { getResume } from '@/api/resumes';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import type {
  Application,
  CandidateNote,
  AIAnalysis,
  Tag,
  Job,
} from '@/types';

interface ApplicationWithJob extends Application {
  job?: Job;
}

function SkeletonSection() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <div className="h-5 w-40 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-3/4 rounded bg-gray-200" />
    </div>
  );
}

function MatchScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-600'
      : score >= 60
        ? 'text-yellow-600'
        : 'text-red-600';

  const strokeColor =
    score >= 80
      ? '#16a34a'
      : score >= 60
        ? '#ca8a04'
        : '#dc2626';

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" className="transform -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Star className={`h-6 w-6 ${score >= 80 ? 'fill-green-500 text-green-500' : score >= 60 ? 'fill-yellow-500 text-yellow-500' : 'fill-red-500 text-red-500'}`} />
        <span className={`text-3xl font-bold ${color}`}>{score}%</span>
        <span className="text-xs text-gray-500">Match</span>
      </div>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLinkJobModalOpen, setIsLinkJobModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [newTagId, setNewTagId] = useState('');

  const { data: candidate, isLoading, isError } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidate(id!),
    enabled: !!id,
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['candidateNotes', id],
    queryFn: () => getCandidateNotes(id!),
    enabled: !!id,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['candidateApplications', id],
    queryFn: () => getCandidateApplications(id!),
    enabled: !!id,
  });

  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['candidateAnalyses', id],
    queryFn: () => getCandidateAnalyses(id!),
    enabled: !!id,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const { data: allJobs } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => getJobs({ limit: 100 }),
    enabled: isLinkJobModalOpen,
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => createNote({ candidateId: id!, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateNotes', id] });
      setNewNoteContent('');
      toast.success('Note added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      updateNote(noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateNotes', id] });
      setEditingNoteId(null);
      setEditNoteContent('');
      toast.success('Note updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateNotes', id] });
      toast.success('Note deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const linkJobMutation = useMutation({
    mutationFn: () =>
      createApplication({ candidateId: id!, jobId: selectedJobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateApplications', id] });
      setIsLinkJobModalOpen(false);
      setSelectedJobId('');
      toast.success('Candidate linked to job');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const analyzeMutation = useMutation({
    mutationFn: (jobId: string) => analyzeMatch(id!, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateAnalyses', id] });
      toast.success('AI analysis complete');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const interviewQuestionsMutation = useMutation({
    mutationFn: (jobId: string) => generateInterviewQuestions(id!, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidateAnalyses', id] });
      toast.success('Interview questions generated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addTagMutation = useMutation({
    mutationFn: (tagId: string) => addTagToCandidate(id!, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      setIsAddTagOpen(false);
      setNewTagId('');
      toast.success('Tag added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeTagMutation = useMutation({
    mutationFn: (tagId: string) => removeTagFromCandidate(id!, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', id] });
      toast.success('Tag removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const tags = (tagsData || []) as Tag[];
  const candidateNotes = (notes || []) as CandidateNote[];
  const allAnalyses = (analyses || []) as AIAnalysis[];
  const jobApps = (applications || []) as ApplicationWithJob[];

  const allJobsList = (allJobs?.data || []) as Job[];
  const availableJobs = allJobsList.filter(
    (job) => !jobApps.some((app) => app.jobId === job._id),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SkeletonSection />
            <SkeletonSection />
          </div>
          <div className="space-y-6">
            <SkeletonSection />
            <SkeletonSection />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <Briefcase className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Candidate not found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The candidate you're looking for doesn't exist or was removed.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-6"
          onClick={() => navigate('/candidates')}
        >
          Back to Candidates
        </Button>
      </div>
    );
  }

  const resumeId = candidate.resumeIds?.[0];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/candidates')}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Candidates
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Card */}
          <Card>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                  {candidate.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {candidate.fullName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {candidate.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {candidate.email}
                      </span>
                    )}
                    {candidate.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {candidate.phone}
                      </span>
                    )}
                    {candidate.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {candidate.location}
                      </span>
                    )}
                    {candidate.yearsOfExperience !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        {candidate.yearsOfExperience} years exp.
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    {candidate.linkedinUrl && (
                      <a
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {candidate.githubUrl && (
                      <a
                        href={candidate.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-700"
                      >
                        <Github className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="info" size="md">
                      {skill}
                    </Badge>
                  ))}
                  {candidate.skills.length === 0 && (
                    <span className="text-sm text-gray-400">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Tags className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {candidate.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t._id === tagId);
                    return tag ? (
                      <span
                        key={tagId}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: tag.color + '20',
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTagMutation.mutate(tagId)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  <button
                    onClick={() => setIsAddTagOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
                  >
                    <Plus className="h-3 w-3" />
                    Add Tag
                  </button>
                </div>
              </div>

              {candidate.summary && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                  <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                    {candidate.summary}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Work History */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Work History
                </h2>
              </div>
            </CardHeader>
            <CardBody>
              {candidate.workHistory && candidate.workHistory.length > 0 ? (
                <div className="space-y-6">
                  {candidate.workHistory.map((work, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-gray-200">
                      <div className="absolute left-0 top-1 h-3 w-3 -translate-x-1.5 rounded-full border-2 border-primary-500 bg-white" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {work.title}
                        </h3>
                        <p className="text-sm text-gray-600">{work.company}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {formatDate(work.startDate)} -{' '}
                          {work.current ? 'Present' : work.endDate ? formatDate(work.endDate) : 'Present'}
                        </p>
                        {work.description && (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {work.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Briefcase className="h-10 w-10" />}
                  title="No work history"
                  description="Work history will appear here once added"
                />
              )}
            </CardBody>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Education
                </h2>
              </div>
            </CardHeader>
            <CardBody>
              {candidate.education && candidate.education.length > 0 ? (
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-lg border border-gray-100 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {edu.degree} in {edu.fieldOfStudy}
                        </h3>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {edu.startDate} - {edu.endDate || 'Present'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<GraduationCap className="h-10 w-10" />}
                  title="No education history"
                  description="Education history will appear here once added"
                />
              )}
            </CardBody>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">Notes</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-4 space-y-3">
                <Textarea
                  placeholder="Add a note about this candidate..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => createNoteMutation.mutate(newNoteContent)}
                    disabled={!newNoteContent.trim()}
                    isLoading={createNoteMutation.isPending}
                  >
                    Add Note
                  </Button>
                </div>
              </div>

              {notesLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : candidateNotes.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-10 w-10" />}
                  title="No notes yet"
                  description="Add notes to keep track of candidate interactions"
                />
              ) : (
                <div className="space-y-3">
                  {candidateNotes.map((note) => (
                    <div
                      key={note._id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                    >
                      {editingNoteId === note._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditNoteContent('');
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateNoteMutation.mutate({
                                  noteId: note._id,
                                  content: editNoteContent,
                                })
                              }
                              isLoading={updateNoteMutation.isPending}
                              disabled={!editNoteContent.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {note.author?.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(note.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingNoteId(note._id);
                                  setEditNoteContent(note.content);
                                }}
                                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this note?')) {
                                    deleteNoteMutation.mutate(note._id);
                                  }
                                }}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Linked Jobs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Linked Jobs
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLinkJobModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Link
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {appsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : jobApps.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-10 w-10" />}
                  title="No linked jobs"
                  description="Link this candidate to relevant job openings"
                />
              ) : (
                <div className="space-y-3">
                  {jobApps.map((app) => (
                    <div
                      key={app._id}
                      className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-shadow hover:shadow-sm"
                      onClick={() => navigate(`/jobs/${app.jobId}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {app.job?.title || 'Loading...'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {app.job?.companyName || ''}
                          </p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge
                          variant={
                            app.stage === 'hired'
                              ? 'success'
                              : app.stage === 'rejected' || app.stage === 'withdrawn'
                                ? 'danger'
                                : app.stage === 'interview'
                                  ? 'info'
                                  : app.stage === 'offer'
                                    ? 'success'
                                    : 'default'
                          }
                          size="sm"
                        >
                          {app.stage.charAt(0).toUpperCase() + app.stage.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  AI Analysis
                </h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {analysesLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : allAnalyses.length === 0 ? (
                jobApps.length === 0 ? (
                  <EmptyState
                    icon={<Brain className="h-10 w-10" />}
                    title="No analyses yet"
                    description="Link candidate to a job and run AI analysis"
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Run AI analysis for a linked job:</p>
                    {jobApps.map((app) => (
                      <div key={app._id} className="rounded-lg border border-gray-200 p-3">
                        <p className="text-sm font-medium text-gray-900">{app.job?.title || 'Loading...'}</p>
                        <p className="text-xs text-gray-500">{app.job?.companyName || ''}</p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => analyzeMutation.mutate(app.jobId)}
                          isLoading={analyzeMutation.isPending}
                        >
                          <Brain className="h-3.5 w-3.5" />
                          Run AI Analysis
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                allAnalyses.map((analysis) => {
                  const linkedJob = jobApps.find(
                    (app) => app.jobId === analysis.jobId,
                  );
                  return (
                    <div
                      key={analysis._id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <div className="relative flex items-center justify-center">
                          <MatchScoreCircle score={analysis.matchScore} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Job: {linkedJob?.job?.title || 'Unknown'}
                          </p>
                        </div>

                        {analysis.strengths.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-green-700 inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Strengths
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.strengths.map((s) => (
                                <Badge key={s} variant="success" size="sm">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.missingSkills.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-medium text-yellow-700 inline-flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Missing Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysis.missingSkills.map((s) => (
                                <Badge key={s} variant="warning" size="sm">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.possibleConcerns &&
                          analysis.possibleConcerns.length > 0 && (
                            <div>
                              <p className="mb-1.5 text-xs font-medium text-red-700 inline-flex items-center gap-1">
                                <XCircle className="h-3.5 w-3.5" />
                                Concerns
                              </p>
                              <ul className="list-inside list-disc space-y-0.5 text-sm text-gray-600">
                                {analysis.possibleConcerns.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {analysis.recruiterSummary && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-gray-700 inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5" />
                              Recruiter Summary
                            </p>
                            <p className="text-sm leading-relaxed text-gray-600">
                              {analysis.recruiterSummary}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeMutation.mutate(analysis.jobId)}
                            isLoading={analyzeMutation.isPending}
                          >
                            <Brain className="h-3.5 w-3.5" />
                            Re-analyze
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              interviewQuestionsMutation.mutate(analysis.jobId)
                            }
                            isLoading={interviewQuestionsMutation.isPending}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            Generate Interview Questions
                          </Button>
                        </div>

                        {analysis.suggestedInterviewQuestions &&
                          analysis.suggestedInterviewQuestions.length > 0 && (
                            <div className="mt-2 rounded-lg bg-blue-50 p-3">
                              <p className="mb-1.5 text-xs font-medium text-blue-700 inline-flex items-center gap-1">
                                <HelpCircle className="h-3.5 w-3.5" />
                                Interview Questions
                              </p>
                              <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
                                {analysis.suggestedInterviewQuestions.map(
                                  (q, i) => (
                                    <li key={i}>{q}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          {/* Resume Information */}
          {resumeId && (
            <ResumeInfo resumeId={resumeId} candidateId={id!} />
          )}
        </div>
      </div>

      {/* Link to Job Modal */}
      <Modal
        isOpen={isLinkJobModalOpen}
        onClose={() => {
          setIsLinkJobModalOpen(false);
          setSelectedJobId('');
        }}
        title="Link Candidate to Job"
      >
        <div className="space-y-4">
          <Select
            label="Select Job"
            placeholder="Choose a job..."
            options={availableJobs.map((job) => ({
              value: job._id,
              label: `${job.title} at ${job.companyName}`,
            }))}
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          />
          {availableJobs.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              {allJobsList.length === 0
                ? 'No jobs available. Create a job first.'
                : 'Candidate is linked to all available jobs'}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsLinkJobModalOpen(false);
                setSelectedJobId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => linkJobMutation.mutate()}
              disabled={!selectedJobId}
              isLoading={linkJobMutation.isPending}
            >
              Link to Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Tag Modal */}
      <Modal
        isOpen={isAddTagOpen}
        onClose={() => {
          setIsAddTagOpen(false);
          setNewTagId('');
        }}
        title="Add Tag"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Tag"
            placeholder="Choose a tag..."
            options={tags
              .filter((t) => !candidate.tagIds.includes(t._id))
              .map((tag) => ({
                value: tag._id,
                label: tag.name,
              }))}
            value={newTagId}
            onChange={(e) => setNewTagId(e.target.value)}
          />
          {tags.filter((t) => !candidate.tagIds.includes(t._id)).length ===
            0 && (
            <p className="py-4 text-center text-sm text-gray-500">
              All tags have been added
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTagOpen(false);
                setNewTagId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addTagMutation.mutate(newTagId)}
              disabled={!newTagId}
              isLoading={addTagMutation.isPending}
            >
              Add Tag
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ResumeInfo({ resumeId }: { resumeId: string; candidateId: string }) {
  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => getResume(resumeId),
    enabled: !!resumeId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Resume</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!resume) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Resume</h2>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary-600" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {resume.fileName}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded {formatDate(resume.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(resume.filePath, '_blank')}
          >
            <Download className="h-4 w-4" />
            Download Resume
          </Button>
          {resume.parsedData && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer font-medium hover:text-gray-700">
                View Parsed Data
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-2 text-xs">
                {JSON.stringify(resume.parsedData, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
