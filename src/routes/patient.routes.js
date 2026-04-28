import { Router } from 'express';
import { 
    getAllPatients, 
    getPatientById, 
    createPatient, 
    updatePatient, 
    deletePatient 
} from '../controller/patient.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// All patient routes are protected by JWT
router.use(verifyJWT);

router.route('/')
    .get(getAllPatients)
    .post(createPatient);

router.route('/:id')
    .get(getPatientById)
    .put(updatePatient)
    .delete(deletePatient);

export default router;
