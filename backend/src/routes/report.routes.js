import { Router } from 'express';
import * as c from '../controllers/report.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('reports:read'));
router.get('/summary', c.summary);
router.get('/export.csv', c.csv);
export default router;