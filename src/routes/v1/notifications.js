import express from 'express';

import {
    listNotificationsController,
    markAllReadController,
    markReadController,
    unreadCountController
} from '../../controllers/notificationController.js';
import { isAuthenticated } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', isAuthenticated, listNotificationsController);
router.get('/unread-count', isAuthenticated, unreadCountController);
router.put('/read-all', isAuthenticated, markAllReadController);
router.put('/:notificationId/read', isAuthenticated, markReadController);

export default router;
