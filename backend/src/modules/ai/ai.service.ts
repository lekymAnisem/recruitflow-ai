import mongoose from 'mongoose';
import OpenAI from 'openai';
import { AppError } from '../../lib/AppError';
import { config } from '../../config';
import { Candidate } from '../candidates/candidates.model';
import { Job } from '../jobs/jobs.model';
import { Application } from '../applications/applications.model';
import { Resume } from '../resumes/resumes.model';
import { AIAnalysis } from './ai.model';

function getOpenAI(): OpenAI | null {
  if (config.groqApiKey) {
    return new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  if (config.openaiApiKey) {
    return new OpenAI({ apiKey: config.openaiApiKey });
  }
  return null;
}

function buildCandidateProfile(candidate: Record<string, any>, resumeText?: string): string {
  const parts: string[] = [];
  parts.push(`Name: ${candidate.fullName}`);
  if (candidate.email) parts.push(`Email: ${candidate.email}`);
  if (candidate.yearsOfExperience !== undefined) parts.push(`Years of Experience: ${candidate.yearsOfExperience}`);
  if (candidate.summary) parts.push(`Summary: ${candidate.summary}`);
  if (candidate.skills?.length) parts.push(`Skills: ${candidate.skills.join(', ')}`);
  if (candidate.workHistory?.length) {
    const workStr = candidate.workHistory
      .map((w: any) => `${w.title} at ${w.company} (${w.startDate || '?'} - ${w.endDate || w.isCurrent ? 'Present' : '?'})${w.description ? ': ' + w.description : ''}`)
      .join('\n');
    parts.push(`Work History:\n${workStr}`);
  }
  if (candidate.education?.length) {
    const eduStr = candidate.education
      .map((e: any) => `${e.degree ? e.degree + ' in ' : ''}${e.field || ''} at ${e.institution} (${e.startYear || '?'} - ${e.endYear || '?'})`)
      .join('\n');
    parts.push(`Education:\n${eduStr}`);
  }
  if (resumeText) {
    parts.push(`Raw Resume Text:\n${resumeText.substring(0, 3000)}`);
  }
  return parts.join('\n');
}

function buildJobDetails(job: Record<string, any>): string {
  const parts: string[] = [];
  parts.push(`Title: ${job.title}`);
  parts.push(`Company: ${job.companyName}`);
  parts.push(`Description: ${job.description}`);
  if (job.requiredSkills?.length) parts.push(`Required Skills: ${job.requiredSkills.join(', ')}`);
  if (job.experienceLevel) parts.push(`Experience Level: ${job.experienceLevel}`);
  if (job.employmentType) parts.push(`Employment Type: ${job.employmentType}`);
  if (job.location) parts.push(`Location: ${job.location}`);
  return parts.join('\n');
}

function buildAnalyzePrompt(candidate: Record<string, any>, job: Record<string, any>, resumeText?: string): string {
  return `You are an expert AI recruiter assistant. Analyze how well this candidate matches the job description.

CANDIDATE PROFILE:
${buildCandidateProfile(candidate, resumeText)}

JOB DESCRIPTION:
${buildJobDetails(job)}

Return a JSON object (NO markdown, NO code fences, raw JSON only) with exactly these fields:
{
  "matchScore": <number 0-100>,
  "strengths": ["strength1", "strength2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "possibleConcerns": ["concern1", ...],
  "recruiterSummary": "2-3 sentence summary",
  "suggestedInterviewQuestions": ["question1", ...]
}`;
}

function buildInterviewQuestionsPrompt(candidate: Record<string, any>, job: Record<string, any>, resumeText?: string): string {
  return `You are an expert AI recruiter assistant. Generate 5-8 tailored interview questions for this candidate based on the job description.

CANDIDATE PROFILE:
${buildCandidateProfile(candidate, resumeText)}

JOB DESCRIPTION:
${buildJobDetails(job)}

Return a JSON object (NO markdown, NO code fences, raw JSON only) with exactly this field:
{
  "suggestedInterviewQuestions": ["question1", "question2", ...]
}`;
}

function buildRecruiterSummaryPrompt(candidate: Record<string, any>, job: Record<string, any>, resumeText?: string): string {
  return `You are an expert AI recruiter assistant. Write a concise 2-3 sentence recruiter summary for this candidate-job pair.

CANDIDATE PROFILE:
${buildCandidateProfile(candidate, resumeText)}

JOB DESCRIPTION:
${buildJobDetails(job)}

Return a JSON object (NO markdown, NO code fences, raw JSON only) with exactly this field:
{
  "recruiterSummary": "2-3 sentence summary"
}`;
}

function getMockAnalysis(): Record<string, any> {
  return {
    matchScore: 75,
    strengths: ['Strong communication skills', 'Relevant technical expertise'],
    missingSkills: ['Not specified in mock mode'],
    possibleConcerns: ['Unable to perform full analysis - mock mode'],
    recruiterSummary: 'This candidate appears to be a reasonable match for the position. Further manual review is recommended.',
    suggestedInterviewQuestions: [
      'Can you describe your experience with the required technologies?',
      'How does your background align with this role?',
    ],
  };
}

function getMockInterviewQuestions(): string[] {
  return [
    'Can you walk us through your relevant experience for this role?',
    'What specific skills make you a good fit for this position?',
    'Describe a challenging project you have worked on.',
  ];
}

function getMockRecruiterSummary(): string {
  return 'This candidate has relevant background for the position. Further interview assessment is recommended to gauge technical alignment with the role requirements.';
}

function getModel(): string {
  if (config.groqApiKey) return config.groqModel;
  return config.openaiModel || 'gpt-4o-mini';
}

async function callOpenAI(openai: OpenAI, prompt: string, label: string): Promise<Record<string, any>> {
  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const processingTime = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || '';

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError(`Failed to parse AI response for ${label}: invalid JSON`, 500);
  }

  return { ...parsed, rawModelResponse: content, processingTime, modelVersion: response.model };
}

export async function analyzeCandidateForJob(
  candidateId: string,
  jobId: string,
  orgId: string,
) {
  const [candidate, job] = await Promise.all([
    Candidate.findOne({ _id: candidateId, organizationId: orgId }).lean(),
    Job.findOne({ _id: jobId, organizationId: orgId }).lean(),
  ]);

  if (!candidate) throw new AppError('Candidate not found', 404);
  if (!job) throw new AppError('Job not found', 404);

  const resume = await Resume.findOne({ candidateId, organizationId: orgId })
    .sort({ createdAt: -1 })
    .lean();

  const openai = getOpenAI();

  let result: Record<string, any>;

  if (!openai) {
    console.warn('[AI Service] OpenAI API key not set. Returning mock analysis.');
    result = getMockAnalysis();
  } else {
    const prompt = buildAnalyzePrompt(candidate, job, resume?.rawText);
    result = await callOpenAI(openai, prompt, 'analyzeCandidateForJob');
  }

  const analysis = await AIAnalysis.findOneAndUpdate(
    { candidateId, jobId },
    {
      $set: {
        organizationId: orgId,
        candidateId,
        jobId,
        matchScore: result.matchScore ?? 0,
        strengths: result.strengths ?? [],
        missingSkills: result.missingSkills ?? [],
        possibleConcerns: result.possibleConcerns ?? [],
        recruiterSummary: result.recruiterSummary ?? '',
        suggestedInterviewQuestions: result.suggestedInterviewQuestions ?? [],
        rawModelResponse: result.rawModelResponse ?? '',
        modelVersion: result.modelVersion ?? getModel(),
        processingTime: result.processingTime ?? 0,
      },
    },
    { upsert: true, new: true },
  );

  const application = await Application.findOne({ candidateId, jobId, organizationId: orgId });
  if (application) {
    if (!application.aiAnalysisId || !application.aiAnalysisId.equals(analysis._id)) {
      await Application.updateOne(
        { _id: application._id },
        { $set: { aiAnalysisId: analysis._id } },
      );
    }
  }

  return analysis.toJSON();
}

export async function getAnalysesForCandidate(candidateId: string, orgId: string) {
  const analyses = await AIAnalysis.find({ candidateId, organizationId: orgId })
    .populate('jobId', 'title companyName')
    .sort({ createdAt: -1 })
    .lean();

  return analyses;
}

export async function getAnalysesForJob(jobId: string, orgId: string) {
  const analyses = await AIAnalysis.find({ jobId, organizationId: orgId })
    .populate('candidateId', 'fullName email')
    .sort({ createdAt: -1 })
    .lean();

  return analyses;
}

export async function getAnalysisById(analysisId: string, orgId: string) {
  const analysis = await AIAnalysis.findOne({ _id: analysisId, organizationId: orgId })
    .populate('candidateId', 'fullName email skills')
    .populate('jobId', 'title companyName')
    .lean();

  if (!analysis) {
    throw new AppError('Analysis not found', 404);
  }

  return analysis;
}

export async function generateInterviewQuestions(
  candidateId: string,
  jobId: string,
  orgId: string,
): Promise<string[]> {
  const [candidate, job] = await Promise.all([
    Candidate.findOne({ _id: candidateId, organizationId: orgId }).lean(),
    Job.findOne({ _id: jobId, organizationId: orgId }).lean(),
  ]);

  if (!candidate) throw new AppError('Candidate not found', 404);
  if (!job) throw new AppError('Job not found', 404);

  const resume = await Resume.findOne({ candidateId, organizationId: orgId })
    .sort({ createdAt: -1 })
    .lean();

  const openai = getOpenAI();

  if (!openai) {
    console.warn('[AI Service] OpenAI API key not set. Returning mock interview questions.');
    return getMockInterviewQuestions();
  }

  const prompt = buildInterviewQuestionsPrompt(candidate, job, resume?.rawText);
  const result = await callOpenAI(openai, prompt, 'generateInterviewQuestions');

  return result.suggestedInterviewQuestions ?? [];
}

export async function generateRecruiterSummary(
  candidateId: string,
  jobId: string,
  orgId: string,
): Promise<string> {
  const [candidate, job] = await Promise.all([
    Candidate.findOne({ _id: candidateId, organizationId: orgId }).lean(),
    Job.findOne({ _id: jobId, organizationId: orgId }).lean(),
  ]);

  if (!candidate) throw new AppError('Candidate not found', 404);
  if (!job) throw new AppError('Job not found', 404);

  const resume = await Resume.findOne({ candidateId, organizationId: orgId })
    .sort({ createdAt: -1 })
    .lean();

  const openai = getOpenAI();

  if (!openai) {
    console.warn('[AI Service] OpenAI API key not set. Returning mock recruiter summary.');
    return getMockRecruiterSummary();
  }

  const prompt = buildRecruiterSummaryPrompt(candidate, job, resume?.rawText);
  const result = await callOpenAI(openai, prompt, 'generateRecruiterSummary');

  return result.recruiterSummary ?? '';
}
