import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    establishmentId: string;
    email: string;
    name: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Sessão não autenticada. Faça login para continuar.' });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }

  req.auth = {
    userId: payload.sub,
    establishmentId: payload.establishmentId,
    email: payload.email,
    name: payload.name,
  };
  next();
}
