import { Router } from 'express';
import { getMeController, loginController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', loginController);
authRouter.get('/me', requireAuth, getMeController);
