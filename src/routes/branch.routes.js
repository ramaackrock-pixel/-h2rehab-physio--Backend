import express from 'express';
const router = express.Router();
import * as branchController from '../controller/branch.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

router.get('/', verifyJWT, branchController.getAllBranches);
router.post('/', verifyJWT, branchController.createBranch);
router.put('/:id', verifyJWT, branchController.updateBranch);
router.delete('/:id', verifyJWT, branchController.deleteBranch);

export default router;
