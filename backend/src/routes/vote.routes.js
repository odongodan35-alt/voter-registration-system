import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { prisma } from '../config/prisma.js';
import * as svc from '../services/vote.service.js';

const router = Router();

const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many requests. Please slow down.' }
});

// ---------------- PUBLIC REGION LOOKUPS ----------------

router.get('/regions/counties', async (req, res, next) => {
  try {
    const counties = await prisma.county.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true }
    });
    res.json(counties);
  } catch (e) { next(e); }
});

router.get('/regions/counties/:countyId/constituencies', async (req, res, next) => {
  try {
    const list = await prisma.constituency.findMany({
      where: { countyId: req.params.countyId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true }
    });
    res.json(list);
  } catch (e) { next(e); }
});

// ---------------- PUBLIC VOTING ----------------

router.post(
  '/verify',
  voteLimiter,
  validate(z.object({
    body: z.object({
      referenceNumber: z.string().trim().min(3),
      phone: z.string().trim().min(9)
    })
  })),
  async (req, res, next) => {
    try { res.json(await svc.verifyVoter(req.validated.body)); }
    catch (e) { next(e); }
  }
);

router.post(
  '/cast',
  voteLimiter,
  validate(z.object({
    body: z.object({
      referenceNumber: z.string().trim().min(3),
      phone: z.string().trim().min(9),
      choices: z.array(z.object({
        positionId: z.string().uuid(),
        candidateId: z.string().uuid()
      })).min(1)
    })
  })),
  async (req, res, next) => {
    try {
      const result = await svc.castVotes({ ...req.validated.body, ip: req.ip });
      res.status(201).json(result);
    } catch (e) { next(e); }
  }
);

router.get('/results', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.countyId) filters.countyId = req.query.countyId;
    if (req.query.constituencyId) filters.constituencyId = req.query.constituencyId;

    const results = await svc.getResults(filters);
    if (!results) return res.status(404).json({ message: 'No election found.' });
    if (!results.election.resultsVisible) {
      return res.status(403).json({ message: 'Results are not yet public.' });
    }
    res.json(results);
  } catch (e) { next(e); }
});

// ---------------- PUBLIC TURNOUT ----------------

router.get('/turnout/counties', async (req, res, next) => {
  try { res.json(await svc.getTurnoutByCounty()); }
  catch (e) { next(e); }
});

router.get('/turnout/counties/:countyId', async (req, res, next) => {
  try { res.json(await svc.getTurnoutByConstituency(req.params.countyId)); }
  catch (e) { next(e); }
});
// ---------------- PUBLIC RECEIPT VERIFICATION ----------------

router.get('/verify-receipt/:receiptCode', async (req, res, next) => {
  try {
    const result = await svc.verifyReceiptCode(req.params.receiptCode);
    if (!result) {
      return res.status(404).json({ valid: false, message: 'Receipt code not found.' });
    }
    res.json(result);
  } catch (e) { next(e); }
});

export default router;