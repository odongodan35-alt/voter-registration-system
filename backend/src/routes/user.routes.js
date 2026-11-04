import { Router } from 'express';
import { z } from 'zod';
import * as c from '../controllers/user.controller.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const KENYAN_PHONE = /^0[17]\d{8}$/;
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character.');

router.get('/', requirePermission('users:list'), c.list);

router.post(
  '/',
  requirePermission('users:create'),
  validate(
    z.object({
      body: z.object({
        fullName: z.string().trim().min(2, 'Full name is required.'),
        email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
        phone: z.string().trim().regex(KENYAN_PHONE, 'Phone number must contain 10 digits and start with 01 or 07.'),
        password: strongPassword,
        role: z.enum(['ADMINISTRATOR', 'REGISTRATION_OFFICER', 'VIEWER'])
      })
    })
  ),
  c.create
);

router.put(
  '/:id',
  requirePermission('users:update'),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        fullName: z.string().trim().min(2).optional(),
        phone: z.string().trim().regex(KENYAN_PHONE, 'Phone number must contain 10 digits and start with 01 or 07.').optional(),
        role: z.enum(['ADMINISTRATOR', 'REGISTRATION_OFFICER', 'VIEWER']).optional()
      })
    })
  ),
  c.update
);

router.patch(
  '/:id/status',
  requirePermission('users:status'),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ status: z.enum(['ACTIVE', 'DISABLED']) })
    })
  ),
  c.setStatus
);

router.patch(
  '/:id/password',
  requirePermission('users:password'),
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ newPassword: strongPassword })
    })
  ),
  c.resetPw
);

router.delete(
  '/:id',
  requirePermission('users:delete'),
  validate(z.object({ params: z.object({ id: z.string().uuid() }) })),
  c.remove
);

export default router;