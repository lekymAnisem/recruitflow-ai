import { Request, Response, NextFunction } from 'express';
import * as candidatesService from './candidates.service';

export async function createCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const candidate = await candidatesService.createCandidate(
      req.body,
      req.user!.userId,
      req.user!.organizationId,
    );
    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
}

export async function getAllCandidates(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, skills, page, limit } = req.query;
    const result = await candidatesService.getAllCandidates(req.user!.organizationId, {
      search: search as string | undefined,
      skills: skills as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateById(req: Request, res: Response, next: NextFunction) {
  try {
    const candidate = await candidatesService.getCandidateById(
      req.user!.organizationId,
      req.params.id,
    );
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
}

export async function updateCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const candidate = await candidatesService.updateCandidate(
      req.user!.organizationId,
      req.params.id,
      req.body,
    );
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    await candidatesService.deleteCandidate(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
