import { Router } from 'express';
import multer from 'multer';
import {
  createAdminBlock,
  createAdminService,
  deleteAdminBlock,
  deleteAdminService,
  getAdminAppointments,
  getAdminBlocks,
  getAdminEstablishment,
  getAdminServices,
  getAdminWorkingHours,
  updateAdminAppointmentStatus,
  updateAdminEstablishment,
  updateAdminService,
  updateAdminWorkingHours,
  uploadAdminImage,
} from '../controllers/admin.controller';

export const adminRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

adminRouter.get('/establishment', getAdminEstablishment);
adminRouter.put('/establishment', updateAdminEstablishment);

adminRouter.get('/services', getAdminServices);
adminRouter.post('/services', createAdminService);
adminRouter.put('/services/:id', updateAdminService);
adminRouter.delete('/services/:id', deleteAdminService);

adminRouter.get('/working-hours', getAdminWorkingHours);
adminRouter.put('/working-hours', updateAdminWorkingHours);

adminRouter.get('/blocks', getAdminBlocks);
adminRouter.post('/blocks', createAdminBlock);
adminRouter.delete('/blocks/:id', deleteAdminBlock);

adminRouter.get('/appointments', getAdminAppointments);
adminRouter.patch('/appointments/:id/status', updateAdminAppointmentStatus);

adminRouter.post('/upload', upload.single('file'), uploadAdminImage);
