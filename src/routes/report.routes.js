import { Router } from 'express';
import { getReportsData } from '../controller/report.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/data').get(getReportsData);

export default router;
