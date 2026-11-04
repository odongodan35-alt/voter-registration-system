import { asyncHandler } from '../utils/asyncHandler.js';
import * as voterService from '../services/voter.service.js';
import { audit } from '../middleware/audit.js';

export const checkDup = asyncHandler(async (req, res) => {
  const dupes = await voterService.checkDuplicates(req.query);
  res.json({ duplicates: dupes });
});

export const create = asyncHandler(async (req, res) => {
  const v = await voterService.createVoter(req.validated.body, req.user.id);
  await audit('RECORD_CREATED', `Created registration ${v.referenceNumber}`)(req, v.id);
  res.status(201).json({ message: 'Registration saved', record: v });
});

export const list = asyncHandler(async (req, res) => {
  const result = await voterService.listVoters(req.query);
  res.json(result);
});

export const getOne = asyncHandler(async (req, res) => {
  const v = await voterService.getVoter(req.params.id);
  if (!v) return res.status(404).json({ message: 'Record not found' });
  res.json(v);
});

export const update = asyncHandler(async (req, res) => {
  const v = await voterService.updateVoter(req.params.id, req.validated.body);
  await audit('RECORD_UPDATED', `Updated ${v.referenceNumber}`)(req, v.id);
  res.json({ message: 'Record updated', record: v });
});

export const archive = asyncHandler(async (req, res) => {
  const v = await voterService.archiveVoter(req.params.id);
  await audit('RECORD_ARCHIVED', `Archived ${v.referenceNumber}`)(req, v.id);
  res.json({ message: 'Record archived', record: v });
});