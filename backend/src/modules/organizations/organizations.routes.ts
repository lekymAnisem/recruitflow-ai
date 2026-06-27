import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import * as organizationsService from './organizations.service';

const router = Router();

router.use(authenticate);

router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationsService.getCurrentOrganization(
      req.user!.userId,
    );
    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organization = await organizationsService.findById(req.params.id);
    res.status(200).json({ success: true, data: organization });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/settings',
  authorize('owner'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organization = await organizationsService.updateSettings(
        req.params.id,
        req.body,
      );
      res.status(200).json({ success: true, data: organization });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
