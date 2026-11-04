import { Router } from 'express';
import { z } from 'zod';
import * as c from '../controllers/voter.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const voterSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.string().optional().nullable(),
  nationality: z.string().default('Kenyan'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  phone: z.string().optional().nullable(),
  countyId: z.string().uuid(), constituencyId: z.string().uuid(), wardId: z.string().uuid(),
  pollingStationId: z.string().uuid().optional().nullable(),
  registrationStatus: z.enum(['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'ARCHIVED']).default('PENDING'),
  notes: z.string().optional().nullable()
});

router.get('/check-duplicates', c.checkDup);
router.get('/',              requirePermission('voters:read'),    c.list);
router.get('/:id',           requirePermission('voters:read'),    c.getOne);
router.post('/',             requirePermission('voters:create'),  validate(z.object({ body: voterSchema })), c.create);
router.put('/:id',           requirePermission('voters:update'),  validate(z.object({ body: voterSchema.partial() })), c.update);
router.patch('/:id/archive', requirePermission('voters:archive'), c.archive);

export default router;