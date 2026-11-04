import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { candidatesForVoter } from './candidate.service.js';

const generateReceipt = () => {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `VT-${year}-${rand}`;
};

export const verifyVoter = async ({ referenceNumber, phone }) => {
  const voter = await prisma.voterRecord.findUnique({
    where: { referenceNumber },
    include: { county: true, constituency: true, ward: true }
  });
  if (!voter) { const e = new Error('No matching voter record found.'); e.status = 404; throw e; }
  if (voter.phone !== phone) { const e = new Error('Reference number or phone does not match our records.'); e.status = 401; throw e; }
  if (voter.registrationStatus !== 'APPROVED') { const e = new Error('Your registration is not yet approved. You cannot vote yet.'); e.status = 403; throw e; }

  const activeElection = await prisma.election.findFirst({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' }
  });
  if (!activeElection) { const e = new Error('Voting is currently closed.'); e.status = 403; throw e; }

  const alreadyVoted = await prisma.vote.findMany({
    where: { voterId: voter.id, electionId: activeElection.id },
    select: { positionId: true }
  });
  const votedPositionIds = alreadyVoted.map((v) => v.positionId);
  const ballot = await candidatesForVoter(voter, activeElection.id);

  return {
    voter: {
      id: voter.id,
      referenceNumber: voter.referenceNumber,
      fullName: voter.fullName,
      county: voter.county?.name,
      constituency: voter.constituency?.name,
      ward: voter.ward?.name
    },
    election: { id: activeElection.id, title: activeElection.title, description: activeElection.description },
    ballot,
    votedPositionIds
  };
};

export const castVotes = async ({ referenceNumber, phone, choices, ip }) => {
  const { voter, election, ballot } = await verifyVoter({ referenceNumber, phone });
  if (!Array.isArray(choices) || choices.length === 0) { const e = new Error('No votes submitted.'); e.status = 400; throw e; }

  const allowedByPosition = new Map();
  for (const b of ballot) {
    allowedByPosition.set(b.position.id, new Set(b.candidates.map((c) => c.id)));
  }
  for (const choice of choices) {
    const allowed = allowedByPosition.get(choice.positionId);
    if (!allowed) { const e = new Error('You are not eligible to vote for one of the selected positions.'); e.status = 403; throw e; }
    if (!allowed.has(choice.candidateId)) { const e = new Error('Invalid candidate selection.'); e.status = 400; throw e; }
  }

  const receiptCode = generateReceipt();

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      await tx.vote.create({
        data: {
          receiptCode: i === 0 ? receiptCode : `${receiptCode}-${i}`,
          electionId: election.id,
          positionId: choice.positionId,
          candidateId: choice.candidateId,
          voterId: voter.id
        }
      });
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'VOTE_CAST',
      description: `Voter ${voter.referenceNumber} cast ${choices.length} vote(s)`,
      ipAddress: ip
    }
  });

  return { receiptCode, votedPositions: choices.length, castAt: new Date() };
};

export const getResults = async (filters = {}) => {
  const { countyId, constituencyId } = filters;

  const election = await prisma.election.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { positions: { orderBy: { order: 'asc' } } }
  });
  if (!election) return null;

  const counties = await prisma.county.findMany();
  const constituencies = await prisma.constituency.findMany();
  const countyMap = Object.fromEntries(counties.map((c) => [c.id, c.name]));
  const constituencyMap = Object.fromEntries(constituencies.map((c) => [c.id, c.name]));

  const voterWhere = {};
  if (constituencyId) voterWhere.constituencyId = constituencyId;
  else if (countyId) voterWhere.countyId = countyId;

  const voterIds = (Object.keys(voterWhere).length > 0)
    ? (await prisma.voterRecord.findMany({ where: voterWhere, select: { id: true } })).map((v) => v.id)
    : null;

  const positions = [];

  for (const p of election.positions) {
    const voteWhere = { electionId: election.id, positionId: p.id };
    if (voterIds) voteWhere.voterId = { in: voterIds };

    if (countyId && p.scope === 'COUNTY') {
      const hasCandidatesHere = await prisma.candidate.count({ where: { positionId: p.id, countyId } });
      if (hasCandidatesHere === 0) continue;
    }
    if (constituencyId && p.scope === 'CONSTITUENCY') {
      const hasCandidatesHere = await prisma.candidate.count({ where: { positionId: p.id, constituencyId } });
      if (hasCandidatesHere === 0) continue;
    }

    const grouped = await prisma.vote.groupBy({ by: ['candidateId'], where: voteWhere, _count: { _all: true } });
    const candidates = await prisma.candidate.findMany({ where: { positionId: p.id }, include: { county: true, constituency: true } });

    const visibleCandidates = candidates.filter((c) => {
      if (p.scope === 'NATIONAL') return true;
      if (countyId && p.scope === 'COUNTY') return c.countyId === countyId;
      if (constituencyId && p.scope === 'CONSTITUENCY') return c.constituencyId === constituencyId;
      if (countyId && p.scope === 'CONSTITUENCY') return c.countyId === countyId;
      return true;
    });
    if (visibleCandidates.length === 0) continue;

    const countByCandidate = {};
    let totalForPosition = 0;
    for (const g of grouped) {
      countByCandidate[g.candidateId] = g._count._all;
      totalForPosition += g._count._all;
    }

    const candidateResults = visibleCandidates.map((c) => ({
      id: c.id,
      name: c.name,
      party: c.party,
      photoUrl: c.photoUrl,
      votes: countByCandidate[c.id] || 0,
      percentage: totalForPosition > 0 ? Math.round(((countByCandidate[c.id] || 0) / totalForPosition) * 1000) / 10 : 0
    })).sort((a, b) => b.votes - a.votes);

    positions.push({ id: p.id, title: p.title, scope: p.scope, totalVotes: totalForPosition, candidates: candidateResults });
  }

  const totalVoters = await prisma.voterRecord.count({ where: { registrationStatus: 'APPROVED', ...voterWhere } });

  const distinctVotersFiltered = await prisma.vote.findMany({
    where: { electionId: election.id, ...(voterIds ? { voterId: { in: voterIds } } : {}) },
    select: { voterId: true },
    distinct: ['voterId']
  });
  const totalVotesCast = distinctVotersFiltered.length;

  return {
    election: {
      id: election.id,
      title: election.title,
      status: election.status,
      resultsVisible: election.resultsVisible,
      endsAt: election.endsAt
    },
    region: {
      countyId: countyId || null,
      countyName: countyId ? (countyMap[countyId] || null) : null,
      constituencyId: constituencyId || null,
      constituencyName: constituencyId ? (constituencyMap[constituencyId] || null) : null
    },
    totalVotesCast,
    totalVoters,
    turnoutPercent: totalVoters > 0 ? Math.round((totalVotesCast / totalVoters) * 1000) / 10 : 0,
    positions
  };
};

export const getTurnoutByCounty = async () => {
  const election = await prisma.election.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!election) return { election: null, counties: [] };

  const counties = await prisma.county.findMany({ orderBy: { name: 'asc' } });

  const registeredGroups = await prisma.voterRecord.groupBy({
    by: ['countyId'],
    where: { registrationStatus: 'APPROVED' },
    _count: { _all: true }
  });
  const registeredMap = Object.fromEntries(registeredGroups.map((g) => [g.countyId, g._count._all]));

  const votes = await prisma.vote.findMany({
    where: { electionId: election.id },
    select: { voterId: true },
    distinct: ['voterId']
  });
  const voterIds = votes.map((v) => v.voterId);

  const votersByCounty = voterIds.length
    ? await prisma.voterRecord.findMany({ where: { id: { in: voterIds } }, select: { countyId: true } })
    : [];

  const votedMap = {};
  for (const v of votersByCounty) votedMap[v.countyId] = (votedMap[v.countyId] || 0) + 1;

  const countiesData = counties.map((c) => {
    const registered = registeredMap[c.id] || 0;
    const voted = votedMap[c.id] || 0;
    return {
      countyId: c.id,
      countyName: c.name,
      countyCode: c.code,
      registeredVoters: registered,
      votesCast: voted,
      turnoutPercent: registered > 0 ? Math.round((voted / registered) * 1000) / 10 : 0
    };
  });
  countiesData.sort((a, b) => b.turnoutPercent - a.turnoutPercent);

  const totalRegistered = countiesData.reduce((s, c) => s + c.registeredVoters, 0);
  const totalVoted = countiesData.reduce((s, c) => s + c.votesCast, 0);

  return {
    election: { id: election.id, title: election.title, status: election.status },
    totals: {
      registeredVoters: totalRegistered,
      votesCast: totalVoted,
      turnoutPercent: totalRegistered > 0 ? Math.round((totalVoted / totalRegistered) * 1000) / 10 : 0
    },
    counties: countiesData
  };
};

export const getTurnoutByConstituency = async (countyId) => {
  const election = await prisma.election.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!election) return { election: null, county: null, constituencies: [] };

  const county = await prisma.county.findUnique({ where: { id: countyId } });
  if (!county) return { election: null, county: null, constituencies: [] };

  const constituencies = await prisma.constituency.findMany({ where: { countyId }, orderBy: { name: 'asc' } });

  const regGroups = await prisma.voterRecord.groupBy({
    by: ['constituencyId'],
    where: { registrationStatus: 'APPROVED', countyId },
    _count: { _all: true }
  });
  const regMap = Object.fromEntries(regGroups.map((g) => [g.constituencyId, g._count._all]));

  const votes = await prisma.vote.findMany({
    where: { electionId: election.id },
    select: { voterId: true },
    distinct: ['voterId']
  });
  const voterIds = votes.map((v) => v.voterId);

  const voters = voterIds.length
    ? await prisma.voterRecord.findMany({ where: { id: { in: voterIds }, countyId }, select: { constituencyId: true } })
    : [];

  const votedMap = {};
  for (const v of voters) votedMap[v.constituencyId] = (votedMap[v.constituencyId] || 0) + 1;

  const data = constituencies.map((c) => {
    const registered = regMap[c.id] || 0;
    const voted = votedMap[c.id] || 0;
    return {
      constituencyId: c.id,
      constituencyName: c.name,
      registeredVoters: registered,
      votesCast: voted,
      turnoutPercent: registered > 0 ? Math.round((voted / registered) * 1000) / 10 : 0
    };
  });
  data.sort((a, b) => b.turnoutPercent - a.turnoutPercent);

  return {
    election: { id: election.id, title: election.title },
    county: { id: county.id, name: county.name, code: county.code },
    constituencies: data
  };
};
/**
 * Verify a receipt code. Returns whether it exists and when it was cast,
 * but NEVER returns the candidate or position (vote privacy).
 */
export const verifyReceiptCode = async (receiptCode) => {
  const vote = await prisma.vote.findUnique({
    where: { receiptCode: receiptCode.trim().toUpperCase() },
    select: {
      castAt: true,
      election: { select: { title: true } }
    }
  });

  if (!vote) return null;

  // Find how many total positions they voted on using the base code
  // (Because votes are saved as CODE, CODE-1, CODE-2, etc.)
  const allVotes = await prisma.vote.findMany({
    where: {
      receiptCode: { startsWith: receiptCode.trim().toUpperCase() }
    },
    select: { positionId: true }
  });

  return {
    valid: true,
    castAt: vote.castAt,
    electionTitle: vote.election?.title || 'General Election',
    positionsVoted: allVotes.length
  };
};