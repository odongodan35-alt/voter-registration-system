import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { authenticate, requirePermission } from '../middleware/auth.js';
import * as svc from '../services/candidate.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const name = 'candidate-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + safeExt;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const router = Router();

router.get('/', authenticate, requirePermission('candidates:read'), async (req, res, next) => {
  try {
    const { positionId, electionId } = req.query;
    res.json(await svc.listCandidates({ positionId, electionId }));
  } catch (e) { next(e); }
});

router.get('/:id', authenticate, requirePermission('candidates:read'), async (req, res, next) => {
  try { res.json(await svc.getCandidate(req.params.id)); }
  catch (e) { next(e); }
});

// -------- CREATE --------
router.post(
  '/',
  authenticate,
  requirePermission('candidates:manage'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const body = req.body;

      const parsed = z.object({
        name: z.string().trim().min(2),
        party: z.string().trim().optional().nullable(),
        slogan: z.string().trim().optional().nullable(),
        bio: z.string().trim().optional().nullable(),
        positionId: z.string().uuid(),
        countyId: z.string().uuid().optional().nullable(),
        constituencyId: z.string().uuid().optional().nullable()
      }).safeParse({
        name: body.name,
        party: body.party || null,
        slogan: body.slogan || null,
        bio: body.bio || null,
        positionId: body.positionId,
        countyId: body.countyId || null,
        constituencyId: body.constituencyId || null
      });

      if (!parsed.success) {
        return res.status(422).json({
          message: 'Validation failed',
          errors: parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
        });
      }

      const photoUrl = req.file ? '/uploads/' + req.file.filename : (body.photoUrl || null);
      const candidate = await svc.createCandidate({ ...parsed.data, photoUrl });
      res.status(201).json(candidate);
    } catch (e) { next(e); }
  }
);

// -------- UPDATE --------
router.put(
  '/:id',
  authenticate,
  requirePermission('candidates:manage'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const body = req.body;

      // Fetch existing so we know the old photo (for cleanup on replace)
      const existing = await svc.getCandidate(id);
      if (!existing) return res.status(404).json({ message: 'Candidate not found' });

      // Validate the fields that were sent
      const schema = z.object({
        name: z.string().trim().min(2).optional(),
        party: z.string().trim().optional().nullable(),
        slogan: z.string().trim().optional().nullable(),
        bio: z.string().trim().optional().nullable(),
        positionId: z.string().uuid().optional(),
        countyId: z.string().uuid().optional().nullable(),
        constituencyId: z.string().uuid().optional().nullable()
      });

      const parsed = schema.safeParse({
        name: body.name || undefined,
        party: body.party !== undefined ? (body.party || null) : undefined,
        slogan: body.slogan !== undefined ? (body.slogan || null) : undefined,
        bio: body.bio !== undefined ? (body.bio || null) : undefined,
        positionId: body.positionId || undefined,
        countyId: body.countyId !== undefined ? (body.countyId || null) : undefined,
        constituencyId: body.constituencyId !== undefined ? (body.constituencyId || null) : undefined
      });

      if (!parsed.success) {
        return res.status(422).json({
          message: 'Validation failed',
          errors: parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
        });
      }

      const data = { ...parsed.data };

      // If a new photo was uploaded, replace and clean up the old file
      if (req.file) {
        data.photoUrl = '/uploads/' + req.file.filename;
        if (existing.photoUrl && existing.photoUrl !== data.photoUrl) {
          svc.safeDeleteUpload(existing.photoUrl);
        }
      }
      // If client explicitly says "remove photo", clean up
      if (body.removePhoto === 'true') {
        if (existing.photoUrl) svc.safeDeleteUpload(existing.photoUrl);
        data.photoUrl = null;
      }

      const updated = await svc.updateCandidate(id, data);
      res.json(updated);
    } catch (e) { next(e); }
  }
);

// -------- DELETE --------
router.delete(
  '/:id',
  authenticate,
  requirePermission('candidates:manage'),
  async (req, res, next) => {
    try {
      await svc.deleteCandidate(req.params.id);
      res.json({ message: 'Candidate deleted' });
    } catch (e) { next(e); }
  }
);

export default router;