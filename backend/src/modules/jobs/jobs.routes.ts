import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createJobSchema, updateJobSchema } from './jobs.validation';
import * as jobsController from './jobs.controller';

const router = Router();

router.get('/public', jobsController.getPublicJobs);
router.get('/public/:id', jobsController.getPublicJobById);

router.use(optionalAuthenticate);

router.get('/', authenticate, jobsController.getAllJobs);
router.get('/:id', authenticate, jobsController.getJobById);
router.post('/', authenticate, validate(createJobSchema), jobsController.createJob);
router.put('/:id', authenticate, validate(updateJobSchema), jobsController.updateJob);
router.delete('/:id', authenticate, jobsController.deleteJob);
router.get('/:id/candidates', authenticate, jobsController.getJobCandidates);

export default router;
