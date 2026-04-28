import { Router } from 'express';
import { 
    createAppointment, 
    getAllAppointments, 
    updateAppointmentStatus, 
    deleteAppointment 
} from '../controller/appointment.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all appointment routes
router.use(verifyJWT);

router.route('/')
    .get(getAllAppointments)
    .post(createAppointment);

router.route('/:id')
    .patch(updateAppointmentStatus)
    .delete(deleteAppointment);

export default router;
