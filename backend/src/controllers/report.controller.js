import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/report.service.js';
export const summary = asyncHandler(async (req, res) => res.json(await svc.summary()));
export const csv = asyncHandler(async (req, res) => {
  const rows = await svc.recordsForExport();
  const headers = ['referenceNumber', 'fullName', 'nationality', 'county', 'constituency', 'ward', 'registrationStatus', 'createdAt'];
  const lines = [headers.join(',')];
  rows.forEach(r => {
    lines.push([
      r.referenceNumber, `"${r.fullName}"`, r.nationality,
      r.county?.name || '', r.constituency?.name || '', r.ward?.name || '',
      r.registrationStatus, r.createdAt.toISOString()
    ].join(','));
  });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="voter-records.csv"');
  res.send(lines.join('\n'));
});