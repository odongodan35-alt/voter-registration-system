import { prisma } from '../config/prisma.js';
export const listLogs = ({ page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  return Promise.all([
    prisma.auditLog.findMany({
      skip, take: Number(limit), orderBy: { timestamp: 'desc' },
      include: { user: { select: { fullName: true, email: true } } }
    }),
    prisma.auditLog.count()
  ]).then(([items, total]) => ({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }));
};