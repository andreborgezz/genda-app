import { Router } from 'express';
import {
  confirmPasswordResetController,
  getMeController,
  loginController,
  requestPasswordResetController,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.get('/me', requireAuth, getMeController);
authRouter.post('/request-password-reset', requestPasswordResetController);
authRouter.post('/confirm-password-reset', confirmPasswordResetController);
