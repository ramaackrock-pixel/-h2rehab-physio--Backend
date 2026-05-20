import express from 'express';
import { getAllServices } from '../controller/service.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyJWT, getAllServices);

export default router;
