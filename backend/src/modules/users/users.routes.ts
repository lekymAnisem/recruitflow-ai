import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.validation';
import * as usersController from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/', usersController.findAll);
router.get('/:id', usersController.findById);
router.post('/', authorize('owner'), validate(createUserSchema), usersController.create);
router.patch('/:id', authorize('owner'), validate(updateUserSchema), usersController.update);
router.delete('/:id', authorize('owner'), usersController.remove);

export default router;
