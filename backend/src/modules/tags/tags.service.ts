import { AppError } from '../../lib/AppError';
import { Tag } from './tags.model';
import { Candidate } from '../candidates/candidates.model';

export async function createTag(name: string, orgId: string, color?: string) {
  const existing = await Tag.findOne({ name, organizationId: orgId });

  if (existing) {
    throw new AppError('Tag with this name already exists', 409);
  }

  const tag = await Tag.create({
    name,
    organizationId: orgId,
    color: color || '#6366f1',
  });

  return tag.toJSON();
}

export async function getAllTags(orgId: string) {
  const tags = await Tag.find({ organizationId: orgId }).sort({ name: 1 });
  return tags.map((t) => t.toJSON());
}

export async function deleteTag(orgId: string, tagId: string) {
  const tag = await Tag.findOneAndDelete({ _id: tagId, organizationId: orgId });

  if (!tag) {
    throw new AppError('Tag not found', 404);
  }

  await Candidate.updateMany(
    { organizationId: orgId, tagIds: tagId },
    { $pull: { tagIds: tagId } },
  );

  return { message: 'Tag deleted successfully' };
}

export async function addTagToCandidate(orgId: string, candidateId: string, tagId: string) {
  const candidate = await Candidate.findOne({ _id: candidateId, organizationId: orgId });

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  if (candidate.tagIds.some((id) => id.toString() === tagId)) {
    throw new AppError('Tag already assigned to candidate', 409);
  }

  candidate.tagIds.push(tagId as any);
  await candidate.save();

  return candidate.toJSON();
}

export async function removeTagFromCandidate(
  orgId: string,
  candidateId: string,
  tagId: string,
) {
  const candidate = await Candidate.findOneAndUpdate(
    { _id: candidateId, organizationId: orgId },
    { $pull: { tagIds: tagId } },
    { new: true },
  );

  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  return candidate.toJSON();
}
