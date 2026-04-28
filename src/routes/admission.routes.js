import express from 'express';
const router = express.Router();
import * as admissionController from '../controller/admission.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

router.get('/', verifyJWT, admissionController.getAllAdmissions);
router.post('/admit', verifyJWT, admissionController.admitPatient);
router.put('/discharge/:id', verifyJWT, admissionController.dischargePatient);

router.get('/rooms', verifyJWT, admissionController.getAllRooms);
router.post('/rooms', verifyJWT, admissionController.createRoom);

export default router;
