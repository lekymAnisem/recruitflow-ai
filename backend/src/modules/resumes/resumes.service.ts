import { AppError } from '../../lib/AppError';
import { Resume } from './resumes.model';
import { Candidate } from '../candidates/candidates.model';
import { uploadToS3 } from '../../lib/s3';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse-debugging-disabled');

const COMMON_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'ruby', 'php', 'go', 'rust',
  'swift', 'kotlin', 'scala', 'react', 'angular', 'vue', 'node.js', 'express', 'django',
  'flask', 'spring', 'rails', 'asp.net', 'html', 'css', 'sass', 'less', 'jquery',
  'redux', 'graphql', 'rest', 'api', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'jenkins',
  'ci/cd', 'git', 'linux', 'nginx', 'agile', 'scrum', 'jira', 'confluence',
  'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch', 'keras',
  'data science', 'data analysis', 'tableau', 'power bi', 'excel', 'looker',
  'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux',
  'communication', 'leadership', 'project management', 'problem solving',
];

export async function uploadResume(
  file: Express.Multer.File,
  orgId: string,
  userId: string,
) {
  const { url } = await uploadToS3(file, orgId);

  const resume = await Resume.create({
    organizationId: orgId,
    fileName: file.originalname,
    filePath: url,
    mimeType: file.mimetype,
    fileSize: file.size,
    uploadedBy: userId,
  });

  return resume.toJSON();
}

export async function extractResumeText(buffer: Buffer, mimeType: string) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new AppError('Unsupported file type for text extraction', 400);
}

export function parseResumeTextToCandidateData(rawText: string) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const result: {
    fullName?: string;
    email?: string;
    phone?: string;
    skills: string[];
    summary?: string;
    workHistory: { company?: string; title?: string; startDate?: string; endDate?: string; description?: string }[];
    education: { institution?: string; degree?: string; field?: string; startYear?: string; endYear?: string }[];
  } = {
    skills: [],
    workHistory: [],
    education: [],
  };

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const dateRangeRegex = /(\b(?:19|20)\d{2}\b)\s*[-–to]+\s*(\b(?:19|20)\d{2}\b|present|current)/i;
  const degreeKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'associate', 'b.s.', 'b.a.', 'm.s.', 'm.a.', 'ph.d.',
    'bachelor\'s', 'master\'s', 'bachelors', 'masters', 'b.tech', 'm.tech', 'b.e.', 'm.e.',
  ];

  const textLower = rawText.toLowerCase();

  for (const line of lines) {
    if (!result.email) {
      const emailMatch = line.match(emailRegex);
      if (emailMatch) {
        result.email = emailMatch[0];
        continue;
      }
    }

    if (!result.phone) {
      const phoneMatch = line.match(phoneRegex);
      if (phoneMatch) {
        result.phone = phoneMatch[0];
        continue;
      }
    }
  }

  if (!result.fullName && lines.length > 0) {
    const firstLine = lines[0];
    if (
      firstLine &&
      !emailRegex.test(firstLine) &&
      !phoneRegex.test(firstLine) &&
      firstLine.split(' ').length >= 2 &&
      firstLine.split(' ').length <= 4
    ) {
      result.fullName = firstLine;
    }
  }

  const foundSkills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const escaped = skill.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(textLower)) {
      foundSkills.push(skill);
    }
  }
  result.skills = [...new Set(foundSkills)];

  const summaryLines: string[] = [];
  let inSummary = false;
  let inWorkHistory = false;
  let inEducation = false;
  let currentWork: any = null;
  let currentEdu: any = null;

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    if (/^(summary|profile|about me|professional summary)/i.test(line)) {
      inSummary = true;
      inWorkHistory = false;
      inEducation = false;
      continue;
    }

    if (
      /^(experience|work experience|employment|work history|professional experience)/i.test(
        line,
      )
    ) {
      inSummary = false;
      inWorkHistory = true;
      inEducation = false;
      continue;
    }

    if (/^(education|academic|academic background)/i.test(line)) {
      inSummary = false;
      inWorkHistory = false;
      inEducation = true;
      continue;
    }

    if (/^(skills|technical skills|core competencies|technologies)/i.test(line)) {
      inSummary = false;
      inWorkHistory = false;
      inEducation = false;
      continue;
    }

    if (inSummary && line.length > 20) {
      summaryLines.push(line);
    }

    if (inWorkHistory) {
      const dateMatch = line.match(dateRangeRegex);
      if (dateMatch && currentWork) {
        currentWork.startDate = dateMatch[1];
        currentWork.endDate = dateMatch[2];
        result.workHistory.push(currentWork);
        currentWork = null;
      }

      if (line.length > 3 && line.length < 150 && !dateMatch) {
        if (currentWork) {
          result.workHistory.push(currentWork);
        }
        currentWork = { company: line, title: undefined, description: undefined };
      } else if (currentWork && dateMatch) {
        currentWork.startDate = dateMatch[1];
        currentWork.endDate = dateMatch[2];
        result.workHistory.push(currentWork);
        currentWork = null;
      } else if (currentWork && line.length > 150) {
        currentWork.description = line;
        result.workHistory.push(currentWork);
        currentWork = null;
      }
    }

    if (inEducation) {
      const hasDegree = degreeKeywords.some((dk) => lineLower.includes(dk));
      if (hasDegree || /\b(university|college|institute|school)\b/i.test(line)) {
        if (currentEdu) {
          result.education.push(currentEdu);
        }
        currentEdu = { institution: line };
        const yearMatch = line.match(/(\b(?:19|20)\d{2}\b)/g);
        if (yearMatch) {
          currentEdu.startYear = yearMatch[0];
          currentEdu.endYear = yearMatch[yearMatch.length - 1];
        }
        degreeKeywords.forEach((dk) => {
          if (lineLower.includes(dk)) {
            currentEdu.degree = line;
          }
        });
      } else if (currentEdu && line.length > 3) {
        const yearMatch = line.match(/(\b(?:19|20)\d{2}\b)/g);
        if (yearMatch) {
          currentEdu.startYear = yearMatch[0];
          currentEdu.endYear = yearMatch[yearMatch.length - 1];
        }
      }
    }
  }

  if (currentWork) result.workHistory.push(currentWork);
  if (currentEdu) result.education.push(currentEdu);

  if (summaryLines.length > 0) {
    result.summary = summaryLines.join(' ').substring(0, 1000);
  }

  return result;
}

export async function getResumeById(resumeId: string) {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new AppError('Resume not found', 404);
  }
  return resume.toJSON();
}

export async function linkResumeToCandidate(resumeId: string, candidateId: string) {
  const resume = await Resume.findByIdAndUpdate(
    resumeId,
    { $set: { candidateId } },
    { new: true },
  );

  if (!resume) {
    throw new AppError('Resume not found', 404);
  }

  await Candidate.findByIdAndUpdate(candidateId, {
    $addToSet: { resumeIds: resumeId },
  });

  return resume.toJSON();
}
