import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createNoteSchema, updateNoteSchema } from './notes.validation';
import * as notesController from './notes.controller';

const router = Router();

router.use(authenticate);

router.get('/candidate/:candidateId', notesController.getNotesForCandidate);
router.post('/', validate(createNoteSchema), notesController.createNote);
router.put('/:id', validate(updateNoteSchema), notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

export default router;
