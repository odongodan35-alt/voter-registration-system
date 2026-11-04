import { prisma } from '../config/prisma.js';

export const getStatistics = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, today, week, verified, pending, byCounty, byWard, byGender] = await Promise.all([
    prisma.voterRecord.count(),
    prisma.voterRecord.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.voterRecord.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.voterRecord.count({ where: { registrationStatus: 'VERIFIED' } }),
    prisma.voterRecord.count({ where: { registrationStatus: 'PENDING' } }),
    prisma.voterRecord.groupBy({ by: ['countyId'], _count: { _all: true } }),
    prisma.voterRecord.groupBy({ by: ['wardId'], _count: { _all: true } }),
    prisma.voterRecord.groupBy({ by: ['gender'], _count: { _all: true } })
  ]);

  const counties = await prisma.county.findMany();
  const wards = await prisma.ward.findMany();
  const countyMap = Object.fromEntries(counties.map(c => [c.id, c.name]));
  const wardMap = Object.fromEntries(wards.map(w => [w.id, w.name]));

  // 1. Recent Records (for the table)
  const recentRecords = await prisma.voterRecord.findMany({
    take: 5, orderBy: { createdAt: 'desc' },
    select: { id: true, referenceNumber: true, fullName: true, createdAt: true, registrationStatus: true }
  });

  // 2. Recent Activity (from Audit Logs)
  const recentActivity = await prisma.auditLog.findMany({
    take: 6,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { fullName: true } } }
  });

  // 3. Top Constituencies
  const topConstituenciesRaw = await prisma.voterRecord.groupBy({
    by: ['constituencyId'],
    _count: { _all: true },
    orderBy: { _count: { constituencyId: 'desc' } },
    take: 5
  });
  const constituencies = await prisma.constituency.findMany();
  const constMap = Object.fromEntries(constituencies.map(c => [c.id, c.name]));
  const topConstituencies = topConstituenciesRaw.map(c => ({
    name: constMap[c.constituencyId] || 'Unknown',
    count: c._count._all
  }));

  // 4. 30-Day Trend
  const activity = await prisma.voterRecord.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  });
  const byDay = {};
  activity.forEach(r => {
    const d = r.createdAt.toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  });

  return {
    totalRecords: total, todayRegistrations: today, weekRegistrations: week,
    verifiedRecords: verified, pendingRecords: pending,
    registrationsByCounty: byCounty.map(r => ({ name: countyMap[r.countyId] || 'Unknown', value: r._count._all })),
    registrationsByWard: byWard.map(r => ({ name: wardMap[r.wardId] || 'Unknown', value: r._count._all })),
    registrationsByGender: byGender.map(r => ({ name: r.gender || 'Unspecified', value: r._count._all })),
    registrationsOverTime: Object.entries(byDay).sort().map(([date, count]) => ({ date, count })),
    recentRecords,
    recentActivity,
    topConstituencies
  };
};