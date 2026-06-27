import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function getSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getSummary(req.user!.organizationId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
