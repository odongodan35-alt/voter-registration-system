import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as svc from '../services/position.service.js';

const router = Router();

router.get('/', authenticate, requirePermission('positions:read'), async (req, res, next) => {
  try {
    const { electionId } = req.query;
    res.json(await svc.listPositions(electionId));
  } catch (e) { next(e); }
});

router.post(
  '/',
  authenticate,
  requirePermission('positions:manage'),
  validate(z.object({
    body: z.object({
      title: z.string().trim().min(2),
      description: z.string().optional().nullable(),
      scope: z.enum(['NATIONAL', 'COUNTY', 'CONSTITUENCY', 'WARD']),
      order: z.number().int().optional(),
      electionId: z.string().uuid()
    })
  })),
  async (req, res, next) => {
    try { res.status(201).json(await svc.createPosition(req.validated.body)); }
    catch (e) { next(e); }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('positions:manage'),
  validate(z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      title: z.string().trim().min(2).optional(),
      description: z.string().optional().nullable(),
      scope: z.enum(['NATIONAL', 'COUNTY', 'CONSTITUENCY', 'WARD']).optional(),
      order: z.number().int().optional()
    })
  })),
  async (req, res, next) => {
    try { res.json(await svc.updatePosition(req.params.id, req.validated.body)); }
    catch (e) { next(e); }
  }
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('positions:manage'),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  async (req, res, next) => {
    try { await svc.deletePosition(req.params.id); res.json({ message: 'Position deleted' }); }
    catch (e) { next(e); }
  }
);

export default router;