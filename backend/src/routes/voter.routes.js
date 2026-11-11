import { prisma } from '../config/prisma.js';
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
  idNumber: z.string().min(4).optional().nullable(),
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
router.get('/:id/card', requirePermission('voters:read'), async (req, res, next) => {
  try {
    const voter = await prisma.voterRecord.findUnique({
      where: { id: req.params.id },
      include: { county: true, ward: true }
    });
    if (!voter) return res.status(404).json({ message: 'Voter not found' });
    
    // Import the PDF service
    const { generateVoterCard } = await import('../services/pdf.service.js');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Voter-ID-${voter.referenceNumber}.pdf"`);
    await generateVoterCard(voter, res);
  } catch (e) { next(e); }
});

export default router;