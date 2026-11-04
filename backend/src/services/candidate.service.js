import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

export const listCandidates = ({ positionId, electionId } = {}) => {
  const where = {};
  if (positionId) where.positionId = positionId;
  if (electionId) where.position = { electionId };
  return prisma.candidate.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { position: true, county: true, constituency: true }
  });
};

export const getCandidate = (id) =>
  prisma.candidate.findUnique({
    where: { id },
    include: { position: true, county: true, constituency: true }
  });

export const createCandidate = (data) =>
  prisma.candidate.create({ data });

export const updateCandidate = (id, data) =>
  prisma.candidate.update({ where: { id }, data });

export const deleteCandidate = async (id) => {
  // Fetch first so we can clean up the photo file
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (candidate?.photoUrl) {
    safeDeleteUpload(candidate.photoUrl);
  }
  return prisma.candidate.delete({ where: { id } });
};

/**
 * Delete a file from the uploads folder. Only touches local /uploads/... paths.
 * Silently ignores missing files.
 */
export const safeDeleteUpload = (photoUrl) => {
  if (!photoUrl) return;
  if (!photoUrl.startsWith('/uploads/')) return;
  const filename = path.basename(photoUrl);
  const fullPath = path.join(UPLOAD_DIR, filename);
  // Safety: ensure resolved path is still inside UPLOAD_DIR
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) return;
  try {
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch (e) {
    console.error('Failed to delete upload:', e.message);
  }
};

/**
 * Return candidates visible to a specific voter, filtered by scope.
 * Used by the voting module (vote.service.js).
 */
export const candidatesForVoter = async (voter, electionId) => {
  const { prisma } = await import('../config/prisma.js');
  const positions = await prisma.position.findMany({
    where: { electionId },
    orderBy: { order: 'asc' }
  });

  const results = [];
  for (const pos of positions) {
    let where = { positionId: pos.id };
    if (pos.scope === 'COUNTY') where.countyId = voter.countyId;
    if (pos.scope === 'CONSTITUENCY') where.constituencyId = voter.constituencyId;
    // NATIONAL: no extra filter. WARD: not used in current seed.

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    if (candidates.length > 0) {
      results.push({ position: pos, candidates });
    }
  }
  return results;
};