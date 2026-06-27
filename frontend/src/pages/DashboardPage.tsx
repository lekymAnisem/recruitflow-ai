import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Star,
  Brain,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { getDashboardSummary } from '@/api/dashboard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatsCard } from '@/components/ui/StatsCard';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { DashboardSummary } from '@/types';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-gray-200" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-6 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-4 flex-1 rounded bg-gray-200" />
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function StageBreakdown({ data }: { data: DashboardSummary }) {
  const stageColors: Record<string, string> = {
    new: 'bg-blue-500',
    screening: 'bg-yellow-500',
    interview: 'bg-purple-500',
    offer: 'bg-green-500',
    hired: 'bg-emerald-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-500',
  };

  const maxCount = Math.max(
    ...data.candidatesByStage.map((s) => s.count),
    1,
  );

  return (
    <div className="space-y-3">
      {data.candidatesByStage.map((stage) => (
        <div key={stage.stage} className="flex items-center gap-3">
          <span className="w-24 text-sm capitalize text-gray-600">
            {stage.stage}
          </span>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all ${
                  stageColors[stage.stage] || 'bg-gray-500'
                }`}
                style={{
                  width: `${(stage.count / maxCount) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="w-8 text-right text-sm font-medium text-gray-700">
            {stage.count}
          </span>
        </div>
      ))}
      {data.candidatesByStage.length === 0 && (
        <p className="py-4 text-center text-sm text-gray-400">
          No candidates in pipeline
        </p>
      )}
    </div>
  );
}

function MatchScore({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'text-green-600 bg-green-50 border-green-200'
      : score >= 60
        ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
        : 'text-red-600 bg-red-50 border-red-200';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${color}`}
    >
      <Star className="h-3.5 w-3.5 fill-current" />
      {score}%
    </span>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardBody>
              <SkeletonTable />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardBody>
              <SkeletonTable />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <FileCheck className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Failed to load dashboard
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {(error as Error)?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your recruitment pipeline
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ExternalLink className="h-4 w-4" />
          Main Page
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={<Briefcase className="h-6 w-6" />}
          label="Total Jobs"
          value={data.totalJobs}
        />
        <StatsCard
          icon={<Users className="h-6 w-6" />}
          label="Total Candidates"
          value={data.totalCandidates}
        />
        <StatsCard
          icon={<FileCheck className="h-6 w-6" />}
          label="Active Applications"
          value={data.activeApplications}
        />
        <StatsCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Pipeline Stages"
          value={data.candidatesByStage.length}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Recent Candidates
              </h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {data.recentCandidates.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.recentCandidates.slice(0, 6).map((candidate) => (
                  <div
                    key={candidate._id}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                        {candidate.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {candidate.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {candidate.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(candidate.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <Users className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No candidates yet</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Stage Distribution
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <StageBreakdown data={data} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Top Matched Candidates
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {data.topMatches.length > 0 ? (
              data.topMatches.map((match) => (
                <div
                  key={`${match.candidate._id}-${match.job._id}`}
                  className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {match.candidate.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {match.job.title}
                      </p>
                    </div>
                    <MatchScore score={match.score} />
                  </div>
                  {match.candidate.summary && (
                    <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-2">
                      {match.candidate.summary}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {match.candidate.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="info" size="sm">
                        {skill}
                      </Badge>
                    ))}
                    {match.candidate.skills.length > 4 && (
                      <Badge variant="default" size="sm">
                        +{match.candidate.skills.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <Star className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No matches calculated yet
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-900">
                Recent AI Analyses
              </h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            {data.recentAnalyses.length > 0 ? (
              data.recentAnalyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis._id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      analysis.matchScore >= 80
                        ? 'bg-green-100 text-green-600'
                        : analysis.matchScore >= 60
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                    }`}
                  >
                    <Brain className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        Match Score: {analysis.matchScore}%
                      </p>
                      <span className="text-xs text-gray-400">
                        {formatDate(analysis.createdAt)}
                      </span>
                    </div>
                    {analysis.strengths.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {analysis.strengths.slice(0, 3).map((strength) => (
                          <Badge key={strength} variant="success" size="sm">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2">
                      {analysis.recruiterSummary}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <Clock className="mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No analyses performed yet
                </p>
              </div>
            )}
            {data.recentAnalyses.length > 5 && (
              <button className="mt-2 flex w-full items-center justify-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                View all analyses
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
