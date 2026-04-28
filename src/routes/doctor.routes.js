import { Router } from 'express';
import { 
    getAllDoctors, 
    createDoctor, 
    updateDoctor, 
    deleteDoctor 
} from '../controller/doctor.controller.js';

const router = Router();

router.route('/')
    .get(getAllDoctors)
    .post(createDoctor);

router.route('/:id')
    .put(updateDoctor)
    .delete(deleteDoctor);

export default router;
