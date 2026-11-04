import { prisma } from '../config/prisma.js';
export const listCounties = () => prisma.county.findMany({ orderBy: { name: 'asc' } });
export const listConstituencies = (countyId) => prisma.constituency.findMany({ where: { countyId }, orderBy: { name: 'asc' } });
export const listWards = (constituencyId) => prisma.ward.findMany({ where: { constituencyId }, orderBy: { name: 'asc' } });
export const listStations = (wardId) => prisma.pollingStation.findMany({ where: { wardId }, orderBy: { name: 'asc' } });