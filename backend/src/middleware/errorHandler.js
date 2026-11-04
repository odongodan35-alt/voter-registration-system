export const errorHandler = (err, req, res, _next) => {
  console.error('[ERROR]', err);
  if (err.code === 'P2002') return res.status(409).json({ message: 'Duplicate value', field: err.meta?.target });
  if (err.code === 'P2025') return res.status(404).json({ message: 'Record not found' });
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};
export const notFound = (req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` });