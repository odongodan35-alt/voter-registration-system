import { asyncHandler } from '../utils/asyncHandler.js';
import { listLogs } from '../services/audit.service.js';
export const list = asyncHandler(async (req, res) => res.json(await listLogs(req.query)));