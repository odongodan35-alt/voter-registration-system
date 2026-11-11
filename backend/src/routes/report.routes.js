import { Router } from 'express';
import * as c from '../controllers/report.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requirePermission('reports:read'));
router.get('/summary', c.summary);
router.get('/export.csv', c.csv);
router.get('/audit-pdf', async (req, res, next) => {
  try {
    const svc = await import('../services/vote.service.js');
    const pdfSvc = await import('../services/pdf.service.js');
    
    const results = await svc.getResults({}); // Get national results
    if (!results) return res.status(404).json({ message: 'No election found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Election-Audit-Report.pdf"');
    await pdfSvc.generateAuditReport(results.election, results, res);
  } catch (e) { next(e); }
});
export default router;