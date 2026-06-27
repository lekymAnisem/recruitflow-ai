import { Request, Response, NextFunction } from 'express';
import * as aiService from './ai.service';

export async function analyzeCandidateForJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { candidateId, jobId } = req.body;
    const analysis = await aiService.analyzeCandidateForJob(
      candidateId,
      jobId,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateAnalyses(req: Request, res: Response, next: NextFunction) {
  try {
    const analyses = await aiService.getAnalysesForCandidate(
      req.params.candidateId,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: analyses });
  } catch (error) {
    next(error);
  }
}

export async function getJobAnalyses(req: Request, res: Response, next: NextFunction) {
  try {
    const analyses = await aiService.getAnalysesForJob(
      req.params.jobId,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: analyses });
  } catch (error) {
    next(error);
  }
}

export async function getAnalysis(req: Request, res: Response, next: NextFunction) {
  try {
    const analysis = await aiService.getAnalysisById(
      req.params.id,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
}

export async function generateInterviewQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { candidateId, jobId } = req.body;
    const questions = await aiService.generateInterviewQuestions(
      candidateId,
      jobId,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
}

export async function generateRecruiterSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { candidateId, jobId } = req.body;
    const summary = await aiService.generateRecruiterSummary(
      candidateId,
      jobId,
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
