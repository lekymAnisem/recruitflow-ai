import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createApplicationSchema, updateStageSchema, publicApplySchema } from './applications.validation';
import { upload } from '../resumes/resumes.multer';
import * as applicationsController from './applications.controller';

const router = Router();

router.post('/public', upload.single('resume'), validate(publicApplySchema), applicationsController.publicApply);

router.use(authenticate);

router.post('/', validate(createApplicationSchema), applicationsController.createApplication);
router.put('/:id/stage', validate(updateStageSchema), applicationsController.updateStage);
router.get('/job/:jobId', applicationsController.getJobApplications);
router.get('/candidate/:candidateId', applicationsController.getCandidateApplications);
router.get('/stage-distribution', applicationsController.getStageDistribution);
router.delete('/:id', applicationsController.deleteApplication);

export default router;
