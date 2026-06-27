import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCandidateSchema, updateCandidateSchema } from './candidates.validation';
import * as candidatesController from './candidates.controller';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCandidateSchema), candidatesController.createCandidate);
router.get('/', candidatesController.getAllCandidates);
router.get('/:id', candidatesController.getCandidateById);
router.put('/:id', validate(updateCandidateSchema), candidatesController.updateCandidate);
router.delete('/:id', candidatesController.deleteCandidate);

export default router;
