import { Request, Response, NextFunction } from 'express';
import * as resumesService from './resumes.service';
import { AppError } from '../../lib/AppError';

export async function uploadResume(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const resume = await resumesService.uploadResume(
      req.file,
      req.user!.organizationId,
      req.user!.userId,
    );

    const extractedText = await resumesService.extractResumeText(
      req.file.buffer,
      req.file.mimetype,
    );

    const parsedData = resumesService.parseResumeTextToCandidateData(extractedText);

    res.status(201).json({
      success: true,
      data: {
        ...resume,
        rawText: extractedText.substring(0, 500),
        parsedData,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getResume(req: Request, res: Response, next: NextFunction) {
  try {
    const resume = await resumesService.getResumeById(req.params.id);
    res.status(200).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
}
