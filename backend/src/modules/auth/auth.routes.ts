import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshSchema, candidateRegisterSchema } from './auth.validation';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/register/candidate', validate(candidateRegisterSchema), authController.registerCandidate);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
