import { prisma } from '../config/prisma.js';

export const listPositions = (electionId) =>
  prisma.position.findMany({
    where: { electionId },
    orderBy: { order: 'asc' },
    include: { candidates: { orderBy: { name: 'asc' } } }
  });

export const createPosition = (data) =>
  prisma.position.create({ data });

export const updatePosition = (id, data) =>
  prisma.position.update({ where: { id }, data });

export const deletePosition = (id) =>
  prisma.position.delete({ where: { id } });