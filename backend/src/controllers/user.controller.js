import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/user.service.js';
import { audit } from '../middleware/audit.js';

export const list = asyncHandler(async (req, res) => res.json(await svc.listUsers()));

export const create = asyncHandler(async (req, res) => {
  const user = await svc.createUser(req.validated.body);
  await audit('USER_CREATED', `Created user ${user.email}`)(req, user.id);
  res.status(201).json({ message: 'User created', user });
});

export const update = asyncHandler(async (req, res) => {
  const user = await svc.updateUser(req.params.id, req.validated.body);
  await audit('USER_UPDATED', `Updated user ${user.email}`)(req, user.id);
  res.json({ message: 'User updated', user });
});

export const setStatus = asyncHandler(async (req, res) => {
  const user = await svc.setStatus(req.params.id, req.validated.body.status);
  await audit('USER_STATUS_CHANGED', `Set ${user.email} to ${user.status}`)(req, user.id);
  res.json({ message: 'Status updated', user });
});

export const resetPw = asyncHandler(async (req, res) => {
  await svc.resetPassword(req.params.id, req.validated.body.newPassword);
  await audit('PASSWORD_RESET', `Reset password for user ${req.params.id}`)(req, req.params.id);
  res.json({ message: 'Password reset' });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.deleteUser(req.params.id, req.user.id);
  await audit('USER_DELETED', `Deleted user ${req.params.id}`)(req, req.params.id);
  res.json({ message: 'User deleted' });
});