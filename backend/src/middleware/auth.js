import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { roleHas } from '../config/permissions.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    if (user.status === 'DISABLED') return res.status(403).json({ message: 'Account disabled' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};

export const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  if (!roleHas(req.user.role, permission)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
};