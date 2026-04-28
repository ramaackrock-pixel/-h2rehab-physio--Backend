import { Router } from 'express';
import { 
    getAllStaff, 
    addStaff, 
    updateStaff, 
    deleteStaff 
} from '../controller/staff.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(getAllStaff)
    .post(addStaff);

router.route('/:id')
    .put(updateStaff)
    .delete(deleteStaff);

export default router;
