import { Router } from 'express';
import { list } from '../controllers/audit.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.get('/', authenticate, requirePermission('audit:read'), list);
export default router;