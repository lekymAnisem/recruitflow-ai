import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { upload } from './resumes.multer';
import * as resumesController from './resumes.controller';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('resume'), resumesController.uploadResume);
router.get('/:id', resumesController.getResume);

export default router;
