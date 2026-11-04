import { prisma } from '../config/prisma.js';

const genRef = () => `VRS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

export const checkDuplicates = async ({ fullName, phone, dateOfBirth }) => {
  const where = { OR: [] };
  if (fullName) where.OR.push({ fullName: { equals: fullName, mode: 'insensitive' } });
  if (phone) where.OR.push({ phone });
  if (dateOfBirth) where.OR.push({ dateOfBirth: new Date(dateOfBirth) });
  if (!where.OR.length) return [];
  return prisma.voterRecord.findMany({
    where, take: 5,
    select: { id: true, referenceNumber: true, fullName: true, dateOfBirth: true, registrationStatus: true }
  });
};

const normalizeDate = (v) => {
  if (!v || v === '') return null;
  // Already an ISO string or Date object?
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const createVoter = async (data, userId) => {
  const referenceNumber = genRef();
  const payload = { ...data };
  if ('dateOfBirth' in payload) payload.dateOfBirth = normalizeDate(payload.dateOfBirth);
  return prisma.voterRecord.create({
    data: { ...payload, referenceNumber, registeredById: userId },
    include: { county: true, constituency: true, ward: true, pollingStation: true, registeredBy: { select: { fullName: true, email: true } } }
  });
};
export const listVoters = async ({ page = 1, limit = 10, search, countyId, constituencyId, wardId, status, sortBy = 'createdAt', sortOrder = 'desc' }) => {
  const where = {};
  if (search) where.OR = [
    { referenceNumber: { contains: search, mode: 'insensitive' } },
    { fullName: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } }
  ];
  if (countyId) where.countyId = countyId;
  if (constituencyId) where.constituencyId = constituencyId;
  if (wardId) where.wardId = wardId;
  if (status) where.registrationStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    prisma.voterRecord.findMany({
      where, skip, take: Number(limit), orderBy: { [sortBy]: sortOrder },
      include: { county: true, constituency: true, ward: true, pollingStation: true, registeredBy: { select: { fullName: true } } }
    }),
    prisma.voterRecord.count({ where })
  ]);
  return { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};

export const getVoter = (id) =>
  prisma.voterRecord.findUnique({
    where: { id },
    include: { county: true, constituency: true, ward: true, pollingStation: true, registeredBy: { select: { fullName: true, email: true } } }
  });
export const updateVoter = (id, data) => {
  const payload = { ...data };
  if ('dateOfBirth' in payload) payload.dateOfBirth = normalizeDate(payload.dateOfBirth);
  return prisma.voterRecord.update({ where: { id }, data: payload });
};
export const archiveVoter = (id) => prisma.voterRecord.update({ where: { id }, data: { registrationStatus: 'ARCHIVED' } });