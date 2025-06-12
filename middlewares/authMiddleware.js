import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/db.js';

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = await prisma.users.findUnique({ where: { id: decoded.id } });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is invalid or expired.' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }
    next();
  };
};