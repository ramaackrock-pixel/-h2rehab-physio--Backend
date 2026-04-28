import { Router } from 'express';
import { getDashboardStats } from '../controller/dashboard.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/stats').get(getDashboardStats);

export default router;
