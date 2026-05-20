import express from 'express';
import { getAllPackages } from '../controller/package.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', verifyJWT, getAllPackages);

export default router;
