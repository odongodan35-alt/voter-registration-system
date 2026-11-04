import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

const KENYAN_PHONE = /^0[17]\d{8}$/;

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character.');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many password reset requests. Try again in 15 minutes.' }
});

// ---- Public signup ----
router.post(
  '/register',
  validate(
    z.object({
      body: z
        .object({
          fullName: z.string().trim().min(2, 'Full name is required.'),
          email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
          phone: z.string().trim().regex(KENYAN_PHONE, 'Phone number must contain 10 digits and start with 01 or 07.'),
          password: passwordSchema,
          confirmPassword: z.string()
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: 'Passwords do not match.',
          path: ['confirmPassword']
        })
    })
  ),
  c.register
);

// ---- Login ----
router.post(
  '/login',
  loginLimiter,
  validate(
    z.object({
      body: z.object({
        email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
        password: z.string().min(1, 'Password is required.')
      })
    })
  ),
  c.login
);

// ---- Password reset ----
router.post(
  '/password-reset/request',
  resetLimiter,
  validate(
    z.object({
      body: z.object({
        email: z.string().trim().toLowerCase().email('Enter a valid email address.')
      })
    })
  ),
  c.requestPasswordReset
);

router.post(
  '/password-reset/verify',
  resetLimiter,
  validate(
    z.object({
      body: z.object({ token: z.string().min(10) })
    })
  ),
  c.verifyPasswordResetToken
);

router.post(
  '/password-reset/confirm',
  resetLimiter,
  validate(
    z.object({
      body: z.object({
        token: z.string().min(10),
        newPassword: passwordSchema
      })
    })
  ),
  c.confirmPasswordReset
);

// ---- Authenticated ----
router.post('/logout', authenticate, c.logout);
router.get('/me', authenticate, c.me);

export default router;