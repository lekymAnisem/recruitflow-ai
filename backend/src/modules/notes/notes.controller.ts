import { Request, Response, NextFunction } from 'express';
import * as notesService from './notes.service';

export async function createNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await notesService.createNote(
      req.body,
      req.user!.userId,
      req.user!.organizationId,
    );
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function getNotesForCandidate(req: Request, res: Response, next: NextFunction) {
  try {
    const notes = await notesService.getNotesForCandidate(
      req.user!.organizationId,
      req.params.candidateId,
    );
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(req: Request, res: Response, next: NextFunction) {
  try {
    const note = await notesService.updateNote(
      req.user!.organizationId,
      req.params.id,
      req.body.content,
    );
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    await notesService.deleteNote(req.user!.organizationId, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
