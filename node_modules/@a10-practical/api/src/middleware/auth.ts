import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret-change-me') as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
