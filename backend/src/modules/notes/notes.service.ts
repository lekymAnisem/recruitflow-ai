import { AppError } from '../../lib/AppError';
import { Note } from './notes.model';

export async function createNote(
  data: { candidateId: string; content: string },
  userId: string,
  orgId: string,
) {
  const note = await Note.create({
    organizationId: orgId,
    candidateId: data.candidateId,
    authorId: userId,
    content: data.content,
  });

  return note.toJSON();
}

export async function getNotesForCandidate(orgId: string, candidateId: string) {
  const notes = await Note.find({ candidateId, organizationId: orgId })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 });

  return notes.map((n) => n.toJSON());
}

export async function updateNote(orgId: string, noteId: string, content: string) {
  const note = await Note.findOneAndUpdate(
    { _id: noteId, organizationId: orgId },
    { $set: { content } },
    { new: true, runValidators: true },
  );

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  return note.toJSON();
}

export async function deleteNote(orgId: string, noteId: string) {
  const note = await Note.findOneAndDelete({
    _id: noteId,
    organizationId: orgId,
  });

  if (!note) {
    throw new AppError('Note not found', 404);
  }

  return { message: 'Note deleted successfully' };
}
