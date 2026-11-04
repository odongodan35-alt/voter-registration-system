import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';

export const listUsers = () => prisma.user.findMany({
  select: {
    id: true, fullName: true, email: true, phone: true,
    role: true, status: true, lastLogin: true, createdAt: true
  },
  orderBy: { createdAt: 'desc' }
});

export const createUser = async ({ fullName, email, phone, password, role }) => {
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
    data: { fullName, email, phone, passwordHash, role },
    select: { id: true, fullName: true, email: true, role: true, status: true }
  });
};

export const updateUser = async (id, data) => {
  if (data.phone) {
    const clash = await prisma.user.findFirst({ where: { phone: data.phone, NOT: { id } } });
    if (clash) {
      const e = new Error('This phone number is already registered.');
      e.status = 409;
      throw e;
    }
  }
  return prisma.user.update({ where: { id }, data });
};

export const setStatus = (id, status) =>
  prisma.user.update({ where: { id }, data: { status } });

export const resetPassword = async (id, newPassword) =>
  prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(newPassword) } });

export const deleteUser = async (targetId, requestingUserId) => {
  if (targetId === requestingUserId) {
    const e = new Error('You cannot delete your own account.');
    e.status = 400;
    throw e;
  }
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    const e = new Error('User not found.');
    e.status = 404;
    throw e;
  }
  if (target.role === 'ADMINISTRATOR') {
    const activeAdmins = await prisma.user.count({
      where: { role: 'ADMINISTRATOR', status: 'ACTIVE' }
    });
    if (activeAdmins <= 1) {
      const e = new Error('Cannot delete the last remaining administrator.');
      e.status = 400;
      throw e;
    }
  }
  const recordCount = await prisma.voterRecord.count({ where: { registeredById: targetId } });
  if (recordCount > 0) {
    const e = new Error('This user has registered voter records and cannot be deleted. Disable the account instead.');
    e.status = 409;
    throw e;
  }
  await prisma.user.delete({ where: { id: targetId } });
  return { id: targetId };
};