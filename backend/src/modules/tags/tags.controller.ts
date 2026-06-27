import { Request, Response, NextFunction } from 'express';
import * as tagsService from './tags.service';

export async function createTag(req: Request, res: Response, next: NextFunction) {
  try {
    const tag = await tagsService.createTag(
      req.body.name,
      req.user!.organizationId,
      req.body.color,
    );
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    next(error);
  }
}

export async function getAllTags(req: Request, res: Response, next: NextFunction) {
  try {
    const tags = await tagsService.getAllTags(req.user!.organizationId);
    res.status(200).json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
}

export async function deleteTag(req: Request, res: Response, next: NextFunction) {
  try {
    await tagsService.deleteTag(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function addTagToCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const candidate = await tagsService.addTagToCandidate(
      req.user!.organizationId,
      req.params.candidateId,
      req.body.tagId,
    );
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
}

export async function removeTagFromCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const candidate = await tagsService.removeTagFromCandidate(
      req.user!.organizationId,
      req.params.candidateId,
      req.params.tagId,
    );
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    next(error);
  }
}
