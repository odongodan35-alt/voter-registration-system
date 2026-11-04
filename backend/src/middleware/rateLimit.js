import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120,
  message: { message: 'Too many requests.' }
});