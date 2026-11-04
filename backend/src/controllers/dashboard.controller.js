import { asyncHandler } from '../utils/asyncHandler.js';
import { getStatistics } from '../services/dashboard.service.js';
export const stats = asyncHandler(async (req, res) => res.json(await getStatistics()));