import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { analyzeSchema, generateQuestionsSchema, generateSummarySchema } from './ai.validation';
import * as aiController from './ai.controller';

const router = Router();

router.use(authenticate);

router.post('/candidate-match', validate(analyzeSchema), aiController.analyzeCandidateForJob);
router.get('/candidate/:candidateId', aiController.getCandidateAnalyses);
router.get('/job/:jobId', aiController.getJobAnalyses);
router.get('/:id', aiController.getAnalysis);
router.post('/interview-questions', validate(generateQuestionsSchema), aiController.generateInterviewQuestions);
router.post('/recruiter-summary', validate(generateSummarySchema), aiController.generateRecruiterSummary);

export default router;
