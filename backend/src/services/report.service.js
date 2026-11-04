import { prisma } from '../config/prisma.js';

export const summary = async () => {
  const [total, byStatus, byCounty] = await Promise.all([
    prisma.voterRecord.count(),
    prisma.voterRecord.groupBy({ by: ['registrationStatus'], _count: { _all: true } }),
    prisma.voterRecord.groupBy({ by: ['countyId'], _count: { _all: true } })
  ]);
  const counties = await prisma.county.findMany();
  const map = Object.fromEntries(counties.map(c => [c.id, c.name]));
  return {
    total,
    byStatus: byStatus.map(s => ({ status: s.registrationStatus, count: s._count._all })),
    byCounty: byCounty.map(c => ({ county: map[c.countyId], count: c._count._all }))
  };
};

export const recordsForExport = () => prisma.voterRecord.findMany({
  select: {
    referenceNumber: true, fullName: true, nationality: true,
    county: { select: { name: true } }, constituency: { select: { name: true } },
    ward: { select: { name: true } }, registrationStatus: true, createdAt: true
  },
  orderBy: { createdAt: 'desc' }
});