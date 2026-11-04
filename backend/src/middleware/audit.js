import { prisma } from '../config/prisma.js';

export const audit = (action, descriptionFn) => async (req, recordId) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action,
        recordId: recordId || null,
        description: typeof descriptionFn === 'function' ? descriptionFn(req) : descriptionFn,
        ipAddress: req.ip
      }
    });
  } catch (e) { console.error('Audit log failed:', e.message); }
};