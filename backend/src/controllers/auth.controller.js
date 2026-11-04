import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import * as passwordResetService from '../services/passwordreset.service.js';
import { prisma } from '../config/prisma.js';

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.validated.body;
  const user = await authService.registerUser({ fullName, email, phone, password });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      description: `New account: ${email}`,
      ipAddress: req.ip,
    },
  });
  res.status(201).json({ message: 'Account created. You can now sign in.', user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const result = await authService.loginUser({ email, password, ip: req.ip });
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: 'LOGOUT',
      description: `${req.user.email} signed out`,
      ipAddress: req.ip,
    },
  });
  res.json({ message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      status: req.user.status,
    },
  });
});

// ---------------- PASSWORD RESET ----------------

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  await passwordResetService.requestReset({ email, ip: req.ip });
  res.json({
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

export const verifyPasswordResetToken = asyncHandler(async (req, res) => {
  const { token } = req.validated.body;
  const row = await passwordResetService.verifyResetToken(token);
  if (!row) {
    return res.status(400).json({ valid: false, message: 'Invalid or expired token.' });
  }
  res.json({ valid: true, email: row.user.email });
});

export const confirmPasswordReset = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.validated.body;
  const result = await passwordResetService.confirmReset({
    rawToken: token,
    newPassword,
    ip: req.ip,
  });
  res.json({
    message: 'Password reset successful. You can now sign in.',
    email: result.email,
  });
});