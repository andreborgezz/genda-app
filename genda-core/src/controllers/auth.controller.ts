import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getEstablishmentById } from '../models/establishment.model';
import {
  createPasswordResetToken,
  deleteExpiredTokensForUser,
  findValidToken,
  markTokenAsUsed,
} from '../models/passwordResetToken.model';
import { getUserByEmail, getUserById, updateUserPasswordHash } from '../models/user.model';
import { sendPasswordResetEmail } from '../services/email.service';
import { hashPassword, signAuthToken, verifyPassword } from '../utils/auth';

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

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido'),
});

const confirmPasswordResetSchema = z.object({
  token: z.string().trim().min(1, 'Token obrigatório'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
});

const NEUTRAL_RESET_MESSAGE =
  'Se esse e-mail estiver cadastrado, você receberá um link em instantes.';

export async function requestPasswordResetController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = requestPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const user = await getUserByEmail(parsed.data.email);
    if (!user) {
      res.json({ message: NEUTRAL_RESET_MESSAGE });
      return;
    }

    await deleteExpiredTokensForUser(user.id);

    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await createPasswordResetToken(user.id, tokenHash, expiresAt);

    const resetUrl = `${env.appUrl}/redefinir-senha?token=${tokenRaw}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ message: NEUTRAL_RESET_MESSAGE });
  } catch (err) {
    next(err);
  }
}

export async function confirmPasswordResetController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = confirmPasswordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(parsed.data.token).digest('hex');
    const tokenRecord = await findValidToken(tokenHash);
    if (!tokenRecord) {
      res.status(400).json({ error: 'Token inválido ou expirado.' });
      return;
    }

    const passwordHash = hashPassword(parsed.data.password);
    await updateUserPasswordHash(tokenRecord.user_id, passwordHash);
    await markTokenAsUsed(tokenRecord.id);

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    next(err);
  }
}
