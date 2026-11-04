import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { sendPasswordResetEmail } from './email.service.js';

const TOKEN_TTL_MINUTES = 30;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Create a reset token for the given email.
 * Always returns success (to prevent email enumeration).
 */
export const requestReset = async ({ email, ip }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always behave the same way externally, even if the email doesn't exist
  if (!user) {
    await prisma.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED_UNKNOWN',
        description: `Reset requested for unknown email: ${email}`,
        ipAddress: ip
      }
    });
    return { ok: true };
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  });

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  try {
    const result = await sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetLink
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        description: `Reset email sent to ${email}`,
        ipAddress: ip
      }
    });

    // In development, log the link so you can use it even if email fails
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n========== PASSWORD RESET LINK ==========');
      console.log(resetLink);
      console.log('==========================================\n');
    }

    return { ok: true, emailSent: !!result.sent };
  } catch (err) {
    console.error('[password-reset] email send failed:', err.message);
    // Still return success — do not reveal email failure to the client
    return { ok: true, emailSent: false };
  }
};

/**
 * Check whether a token is valid (exists, not used, not expired).
 */
export const verifyResetToken = async (rawToken) => {
  if (!rawToken) return null;
  const tokenHash = hashToken(rawToken);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, fullName: true } } }
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt < new Date()) return null;
  return row;
};

/**
 * Consume a token and set a new password.
 */
export const confirmReset = async ({ rawToken, newPassword, ip }) => {
  const row = await verifyResetToken(rawToken);
  if (!row) {
    const e = new Error('This reset link is invalid or has expired.');
    e.status = 400;
    throw e;
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE'
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() }
    })
  ]);

  await prisma.auditLog.create({
    data: {
      userId: row.userId,
      action: 'PASSWORD_RESET_COMPLETED',
      description: `Password reset for ${row.user.email}`,
      ipAddress: ip
    }
  });

  return { ok: true, email: row.user.email };
};