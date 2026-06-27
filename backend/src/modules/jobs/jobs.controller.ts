import { Request, Response, NextFunction } from 'express';
import * as jobsService from './jobs.service';

export async function getPublicJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, page, limit } = req.query;
    const result = await jobsService.getAllPublicJobs({
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getPublicJobById(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.getPublicJobById(req.params.id);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.createJob(
      req.body,
      req.user!.userId,
      req.user!.organizationId,
    );
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function getAllJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, page, limit } = req.query;
    const result = await jobsService.getAllJobs(req.user!.organizationId, {
      status: status as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getJobById(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.getJobById(req.user!.organizationId, req.params.id);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req: Request, res: Response, next: NextFunction) {
  try {
    const job = await jobsService.updateJob(req.user!.organizationId, req.params.id, req.body);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req: Request, res: Response, next: NextFunction) {
  try {
    await jobsService.deleteJob(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getJobCandidates(req: Request, res: Response, next: NextFunction) {
  try {
    const applications = await jobsService.getJobCandidates(
      req.user!.organizationId,
      req.params.id,
    );
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
}
