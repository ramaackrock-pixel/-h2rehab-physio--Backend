import { Router } from 'express';
import { 
    createInvoice, 
    getAllInvoices, 
    getInvoiceById, 
    updateInvoice 
} from '../controller/billing.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.route('/')
    .get(getAllInvoices)
    .post(createInvoice);

router.route('/:id')
    .get(getInvoiceById)
    .patch(updateInvoice);

export default router;
