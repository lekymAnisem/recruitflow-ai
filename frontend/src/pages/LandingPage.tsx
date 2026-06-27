import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Radar, ArrowRight, Users, Briefcase, Zap,
  LayoutDashboard, Search, MapPin, Clock, DollarSign,
  X, Send, Building2, ChevronDown, ChevronUp, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/store/authStore';
import { getPublicJobs } from '@/api/jobs';
import { publicApply } from '@/api/applications';
import type { Job } from '@/types';

function JobDetailModal({
  job,
  onClose,
  onApply,
}: {
  job: Job;
  onClose: () => void;
  onApply: () => void;
}) {
  const desc = job.description || '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-12">
      <div className="relative w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-gray-700 p-6">
          <h2 className="text-xl font-bold text-white">{job.title}</h2>
          <p className="mt-1 text-gray-400">{job.companyName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {job.location && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
              <Briefcase className="h-3.5 w-3.5" />
              {job.employmentType?.replace('-', ' ')}
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {job.experienceLevel}
            </span>
            {job.salaryRange?.min && (
              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                <DollarSign className="h-3.5 w-3.5" />
                {job.salaryRange.min.toLocaleString()} – {job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-300">Job Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-400">{desc}</p>
          </div>

          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => (
                  <Badge key={skill} variant="info" size="sm">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 p-6">
          <Button variant="primary" size="lg" className="w-full" onClick={onApply}>
            Apply Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyModal({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('jobId', job._id);
      fd.append('fullName', fullName);
      fd.append('email', email);
      if (phone) fd.append('phone', phone);
      if (resume) fd.append('resume', resume);
      await publicApply(fd);
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
    } catch (err: unknown) {
      let text = 'Application failed. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } };
        text = axiosErr.response?.data?.message || text;
        if (axiosErr.response?.data?.errors?.length) {
          text += `: ${axiosErr.response.data.errors.map(e => e.message).join(', ')}`;
        }
      } else if (err instanceof Error) {
        text = err.message;
      }
      setMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-white">Apply for {job.title}</h2>
        <p className="mt-1 text-sm text-gray-400">{job.companyName}</p>

        {message ? (
          <div className={`mt-4 rounded-lg p-3 text-sm ${
            message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {message.text}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Resume (optional)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-600 bg-gray-800/50 px-3 py-3 text-sm text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-colors">
                <Upload className="h-4 w-4" />
                <span>{resume ? resume.name : 'Upload resume (PDF, DOCX)'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={submitting}>
              <Send className="h-4 w-4" />
              Submit Application
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, onView }: { job: Job; onView: () => void }) {
  return (
    <div className="group cursor-pointer rounded-xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-sm transition-all hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/5"
      onClick={onView}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white group-hover:text-primary-400 transition-colors">
            {job.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-400">
            <Building2 className="h-3.5 w-3.5" />
            {job.companyName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {job.location && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
          <Briefcase className="h-3 w-3" />
          {job.employmentType?.replace('-', ' ')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {job.experienceLevel}
        </span>
      </div>

      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {job.requiredSkills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="default" size="sm">{skill}</Badge>
          ))}
          {job.requiredSkills.length > 4 && (
            <Badge variant="default" size="sm">+{job.requiredSkills.length - 4}</Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyingTo, setApplyingTo] = useState<Job | null>(null);
  const [showAllJobs, setShowAllJobs] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['publicJobs', search],
    queryFn: () => getPublicJobs({ search: search || undefined, limit: 50 }),
  });

  const jobs: Job[] = data?.data || [];
  const featuredJobs = showAllJobs ? jobs : jobs.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <Radar className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">RecruitFlow AI</span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated && user?.role === 'candidate' ? (
            <>
              <span className="text-sm text-gray-400">{user.name}</span>
              <button onClick={logout} className="text-sm font-medium text-gray-300 hover:text-white">
                Sign out
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/dashboard?post=1">
                <Button variant="primary" size="sm">
                  Post a Job
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white">
                Sign in
              </Link>
              <Link to="/register/candidate">
                <Button variant="primary" size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 sm:px-12">
        <section className="py-12 text-center sm:py-20">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <Radar className="h-9 w-9 text-white" />
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Find Your Next{' '}
            <span className="text-primary-400">Opportunity</span>
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-base text-gray-400">
            Browse job vacancies from top companies. AI-powered recruitment to match you with the perfect role.
          </p>

          <div className="mx-auto max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs by title or company..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800/80 py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 backdrop-blur-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {search ? 'Search Results' : 'Latest Opportunities'}
              </h2>
              <p className="mt-0.5 text-sm text-gray-400">
                {data ? `${data.pagination?.total || jobs.length} job${jobs.length !== 1 ? 's' : ''} found` : ''}
              </p>
            </div>
            {!showAllJobs && jobs.length > 6 && (
              <button
                onClick={() => setShowAllJobs(true)}
                className="flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300"
              >
                View all
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
            {showAllJobs && jobs.length > 6 && (
              <button
                onClick={() => setShowAllJobs(false)}
                className="flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300"
              >
                Show less
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-800 bg-gray-900/60 p-5">
                  <div className="h-5 w-3/4 rounded bg-gray-800" />
                  <div className="mt-2 h-4 w-1/2 rounded bg-gray-800" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-5 w-16 rounded-full bg-gray-800" />
                    <div className="h-5 w-20 rounded-full bg-gray-800" />
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <div className="h-5 w-14 rounded bg-gray-800" />
                    <div className="h-5 w-16 rounded bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="mb-3 h-10 w-10 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">No jobs found</p>
              <p className="mt-1 text-sm text-gray-500">
                {search ? 'Try a different search term' : 'No job vacancies posted yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onView={() => setSelectedJob(job)}
                />
              ))}
            </div>
          )}
        </section>

        {!isAuthenticated && jobs.length > 0 && (
          <section className="mt-12 text-center">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white">Want to post a job?</h2>
              <p className="mt-2 text-sm text-gray-400">
                Create an account to start posting vacancies and manage your recruitment pipeline.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">Sign in</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm">
            <Users className="mb-3 h-8 w-8 text-primary-400" />
            <h3 className="mb-1 font-semibold text-white">Browse Openings</h3>
            <p className="text-sm text-gray-400">
              Explore opportunities from multiple companies in one place.
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm">
            <Zap className="mb-3 h-8 w-8 text-primary-400" />
            <h3 className="mb-1 font-semibold text-white">Quick Apply</h3>
            <p className="text-sm text-gray-400">
              Apply to positions with just your name and email. No account needed.
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 backdrop-blur-sm">
            <Briefcase className="mb-3 h-8 w-8 text-primary-400" />
            <h3 className="mb-1 font-semibold text-white">AI Matched</h3>
            <p className="text-sm text-gray-400">
              Companies use AI to find the best candidates for each role.
            </p>
          </div>
        </section>
      </main>

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApply={() => {
            setApplyingTo(selectedJob);
            setSelectedJob(null);
          }}
        />
      )}

      {applyingTo && (
        <ApplyModal
          job={applyingTo}
          onClose={() => setApplyingTo(null)}
        />
      )}
    </div>
  );
}
