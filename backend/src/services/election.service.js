import { prisma } from '../config/prisma.js';

export const getActiveElection = () =>
  prisma.election.findFirst({
    where: { status: { in: ['UPCOMING', 'OPEN'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      positions: {
        orderBy: { order: 'asc' },
        include: { candidates: { orderBy: { name: 'asc' } } }
      }
    }
  });

export const listElections = () =>
  prisma.election.findMany({ orderBy: { createdAt: 'desc' } });

export const createElection = (data) =>
  prisma.election.create({ data });

export const updateElection = (id, data) =>
  prisma.election.update({ where: { id }, data });