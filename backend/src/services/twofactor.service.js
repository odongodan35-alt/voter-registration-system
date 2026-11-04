import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { encrypt, decrypt, randomHex } from '../utils/crypto.js';

const require = createRequire(import.meta.url);

// otplib v13+ exposes top-level functions (generateSecret, generate, verify, generateURI)
const otplib = require('otplib');
const QRCode = (() => {
  const m = require('qrcode');
  return m.default || m;
})();

const APP_NAME = 'VRS Kenya';

const CONFIG = {
  digits: 6,
  step: 30,
  window: 1
};

/**
 * Generate a fresh secret + otpauth URL + QR data-URL for the given user.
 */
export const generateSecret = async (user) => {
  const secret = otplib.generateSecret(); // base32
  const otpauth = otplib.generateURI({
    secret,
    label: user.email,
    issuer: APP_NAME,
    digits: CONFIG.digits,
    step: CONFIG.step
  });
  const qrDataUrl = await QRCode.toDataURL(otpauth, { width: 240, margin: 1 });
  return { secret, otpauth, qrDataUrl };
};

export const savePendingSecret = async (userId, secret) => {
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encrypt(secret) }
  });
};

export const verifyCode = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true }
  });
  if (!user?.twoFactorSecret) return false;

  let secret;
  try {
    secret = decrypt(user.twoFactorSecret);
  } catch {
    return false;
  }

  const token = String(code).trim();

  // Try the modern (v13) API first
  try {
    const result = await otplib.verify({
      secret,
      token,
      window: 1,
      digits: 6,
      period: 30
    });
    if (result === true) return true;
    if (result && typeof result === 'object' && result.valid === true) return true;
  } catch (e) {
    console.log('[2FA] verify (new API) threw:', e.message);
  }

  // Fall back to the older class-based API
  try {
    if (otplib.TOTP) {
      const totp = new otplib.TOTP({ window: 1, digits: 6, period: 30 });
      const ok = totp.verify(token, { secret });
      if (ok === true || ok?.valid === true) return true;
    }
  } catch (e) {
    console.log('[2FA] verify (TOTP class) threw:', e.message);
  }

  return false;
};

export const generateRecoveryCodes = () => {
  const plain = [];
  const hashed = [];
  for (let i = 0; i < 10; i++) {
    const part1 = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    const part2 = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    const code = `${part1}-${part2}`;
    plain.push(code);
    hashed.push(hashRecoveryCode(code));
  }
  return { plain, hashed };
};

const hashRecoveryCode = (code) => {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
};

export const consumeRecoveryCode = async (userId, code) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { recoveryCodes: true }
  });
  if (!user?.recoveryCodes?.length) return false;

  const hash = hashRecoveryCode(code.trim().toUpperCase());
  const index = user.recoveryCodes.indexOf(hash);
  if (index === -1) return false;

  const updated = user.recoveryCodes.slice();
  updated.splice(index, 1);
  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCodes: updated }
  });
  return true;
};

export const enableTwoFactor = async (userId, hashedRecoveryCodes) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      recoveryCodes: hashedRecoveryCodes
    }
  });
};

export const disableTwoFactor = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: [],
      pendingLoginToken: null,
      pendingLoginExpiry: null
    }
  });
};

export const createPendingLoginToken = async (userId) => {
  const token = randomHex(24);
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { pendingLoginToken: token, pendingLoginExpiry: expires }
  });
  return token;
};

export const findUserByPendingToken = async (token) => {
  const user = await prisma.user.findFirst({
    where: {
      pendingLoginToken: token,
      pendingLoginExpiry: { gt: new Date() }
    }
  });
  return user || null;
};

export const clearPendingToken = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { pendingLoginToken: null, pendingLoginExpiry: null }
  });
};