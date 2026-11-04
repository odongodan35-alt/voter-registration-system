import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as svc from '../services/election.service.js';

const router = Router();

// Public: get active election (used by /vote and /results pages)
router.get('/active', async (req, res, next) => {
  try {
    res.json(await svc.getActiveElection());
  } catch (e) { next(e); }
});

// Admin: list all
router.get('/', authenticate, requirePermission('elections:read'), async (req, res, next) => {
  try { res.json(await svc.listElections()); } catch (e) { next(e); }
});

// Admin: create
router.post(
  '/',
  authenticate,
  requirePermission('elections:manage'),
  validate(z.object({
    body: z.object({
      title: z.string().trim().min(3),
      description: z.string().optional().nullable(),
      status: z.enum(['UPCOMING', 'OPEN', 'CLOSED']).optional(),
      startsAt: z.string().optional().nullable(),
      endsAt: z.string().optional().nullable()
    })
  })),
  async (req, res, next) => {
    try {
      const data = { ...req.validated.body };
      if (data.startsAt) data.startsAt = new Date(data.startsAt);
      if (data.endsAt) data.endsAt = new Date(data.endsAt);
      res.status(201).json(await svc.createElection(data));
    } catch (e) { next(e); }
  }
);

// Admin: update status / results visibility
router.patch(
  '/:id',
  authenticate,
  requirePermission('elections:manage'),
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      title: z.string().trim().min(3).optional(),
      description: z.string().optional().nullable(),
      status: z.enum(['UPCOMING', 'OPEN', 'CLOSED']).optional(),
      resultsVisible: z.boolean().optional()
    })
  })),
  async (req, res, next) => {
    try {
      res.json(await svc.updateElection(req.params.id, req.validated.body));
    } catch (e) { next(e); }
  }
);

export default router;