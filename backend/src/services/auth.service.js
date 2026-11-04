import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const registerUser = async ({ fullName, email, phone, password }) => {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const e = new Error('This email address is already registered.');
    e.status = 409;
    throw e;
  }
  const existingPhone = await prisma.user.findUnique({ where: { phone } });
  if (existingPhone) {
    const e = new Error('This phone number is already registered.');
    e.status = 409;
    throw e;
  }
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { fullName, email, phone, passwordHash, role: 'VIEWER' },
    select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
  });
};

export const loginUser = async ({ email, password, ip }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const e = new Error('Account temporarily locked. Try again later.');
    e.status = 423;
    throw e;
  }
  if (user.status === 'DISABLED') {
    const e = new Error('This account has been disabled. Contact an administrator.');
    e.status = 403;
    throw e;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedAttempts + 1;
    const data = { failedAttempts: failed };
    if (failed >= MAX_ATTEMPTS) {
      data.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      data.failedAttempts = 0;
    }
    await prisma.user.update({ where: { id: user.id }, data });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_FAILED',
        description: `Failed login attempt for ${email}`,
        ipAddress: ip,
      },
    });
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      description: `User ${email} signed in`,
      ipAddress: ip,
    },
  });

  const token = signToken({ id: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};