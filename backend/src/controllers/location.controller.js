import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/location.service.js';
export const counties = asyncHandler(async (req, res) => res.json(await svc.listCounties()));
export const constituencies = asyncHandler(async (req, res) => res.json(await svc.listConstituencies(req.params.id)));
export const wards = asyncHandler(async (req, res) => res.json(await svc.listWards(req.params.id)));
export const stations = asyncHandler(async (req, res) => res.json(await svc.listStations(req.params.id)));