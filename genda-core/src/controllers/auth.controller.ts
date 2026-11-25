import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getEstablishmentById } from '../models/establishment.model';
import { getUserByEmail, getUserById } from '../models/user.model';
import { signAuthToken, verifyPassword } from '../utils/auth';

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
  rememberMe: z.boolean().optional().default(true),
});

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const { email, password, rememberMe } = parsed.data;
    const user = await getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const expiresInSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const token = signAuthToken(
      {
        sub: user.id,
        establishmentId: user.establishment_id,
        email: user.email,
        name: user.name,
      },
      expiresInSeconds
    );

    const establishment = await getEstablishmentById(user.establishment_id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        establishment_id: user.establishment_id,
        plan_name: user.plan_name,
        plan_status: user.plan_status,
      },
      establishment,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMeController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const [user, establishment] = await Promise.all([
      getUserById(req.auth.userId),
      getEstablishmentById(req.auth.establishmentId),
    ]);

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    res.json({ user, establishment });
  } catch (err) {
    next(err);
  }
}
