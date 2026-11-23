import { Router } from 'express';
import {
  createPublicBooking,
  getPublicEstablishment,
  getPublicSlots,
} from '../controllers/public.controller';

export const publicRouter = Router();

publicRouter.get('/establishments/:slug', getPublicEstablishment);
publicRouter.get('/establishments/:slug/slots', getPublicSlots);
publicRouter.post('/establishments/:slug/appointments', createPublicBooking);
