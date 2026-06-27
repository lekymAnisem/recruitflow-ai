export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager' | 'candidate';
  organizationId?: string;
  createdAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
}

export interface Job {
  _id: string;
  title: string;
  companyName: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  employmentType: 'full-time' | 'part-time' | 'contract' | 'temporary' | 'internship';
  location: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'open' | 'closed' | 'filled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  yearsOfExperience?: number;
  summary?: string;
  skills: string[];
  workHistory?: WorkExperience[];
  education?: Education[];
  resumeIds: string[];
  tagIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
}

export interface Resume {
  _id: string;
  candidateId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  rawText?: string;
  parsedData?: Record<string, unknown>;
  createdAt: string;
}

export interface Application {
  _id: string;
  candidateId: string;
  jobId: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
  aiAnalysisId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateNote {
  _id: string;
  candidateId: string;
  authorId: string;
  content: string;
  author?: Pick<User, '_id' | 'name' | 'email'>;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface AIAnalysis {
  _id: string;
  candidateId: string;
  jobId: string;
  matchScore: number;
  strengths: string[];
  missingSkills: string[];
  possibleConcerns?: string[];
  recruiterSummary: string;
  suggestedInterviewQuestions?: string[];
  createdAt: string;
}

export interface DashboardSummary {
  totalJobs: number;
  totalCandidates: number;
  activeApplications: number;
  candidatesByStage: { stage: string; count: number }[];
  recentCandidates: Candidate[];
  recentAnalyses: AIAnalysis[];
  topMatches: { candidate: Candidate; job: Job; score: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
