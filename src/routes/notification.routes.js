import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controller/notification.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all notification routes
router.use(verifyJWT);

router.route('/')
    .get(getNotifications);

router.route('/:id/read')
    .patch(markNotificationAsRead);

export default router;
