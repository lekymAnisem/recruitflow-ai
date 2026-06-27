import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createTagSchema, addTagToCandidateSchema } from './tags.validation';
import * as tagsController from './tags.controller';

const router = Router();

router.use(authenticate);

router.get('/', tagsController.getAllTags);
router.post('/', validate(createTagSchema), tagsController.createTag);
router.delete('/:id', tagsController.deleteTag);
router.post(
  '/candidate/:candidateId',
  validate(addTagToCandidateSchema),
  tagsController.addTagToCandidate,
);
router.delete('/candidate/:candidateId/:tagId', tagsController.removeTagFromCandidate);

export default router;
