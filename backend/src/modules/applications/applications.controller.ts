import { Request, Response, NextFunction } from 'express';
import * as applicationsService from './applications.service';

export async function publicApply(req: Request, res: Response, next: NextFunction) {
  try {
    console.log('[publicApply] body:', JSON.stringify(req.body));
    console.log('[publicApply] file:', req.file ? { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } : 'NO FILE');
    const application = await applicationsService.publicApply(req.body, req.file);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

export async function createApplication(req: Request, res: Response, next: NextFunction) {
  try {
    const application = await applicationsService.createApplication(
      req.body,
      req.user!.userId,
      req.user!.organizationId,
    );
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

export async function updateStage(req: Request, res: Response, next: NextFunction) {
  try {
    const application = await applicationsService.updateStage(
      req.user!.organizationId,
      req.params.id,
      req.body.stage,
    );
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
}

export async function getJobApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const applications = await applicationsService.getApplicationsForJob(
      req.user!.organizationId,
      req.params.jobId,
    );
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function getCandidateApplications(req: Request, res: Response, next: NextFunction) {
  try {
    const applications = await applicationsService.getApplicationsForCandidate(
      req.user!.organizationId,
      req.params.candidateId,
    );
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
}

export async function deleteApplication(req: Request, res: Response, next: NextFunction) {
  try {
    await applicationsService.deleteApplication(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getStageDistribution(req: Request, res: Response, next: NextFunction) {
  try {
    const distribution = await applicationsService.getStageDistribution(
      req.user!.organizationId,
    );
    res.status(200).json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
}
