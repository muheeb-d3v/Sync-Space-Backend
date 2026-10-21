import { StatusCodes } from 'http-status-codes';

import {
    listNotificationsService,
    markAllNotificationsReadService,
    markNotificationReadService,
    unreadNotificationCountService
} from '../services/notificationService.js';
import { customErrorResponse, successResponse } from '../utils/common/responseObjects.js';

export const listNotificationsController = async (req, res) => {
    try {
        const notifications = await listNotificationsService(
            req.user.id,
            req.query.filter || 'all'
        );

        return res
            .status(StatusCodes.OK)
            .json(successResponse(notifications, 'Notifications fetched successfully'));
    } catch (error) {
        console.error('[ERROR] listNotificationsController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const unreadCountController = async (req, res) => {
    try {
        const count = await unreadNotificationCountService(req.user.id);
        return res
            .status(StatusCodes.OK)
            .json(successResponse({ count }, 'Unread notification count fetched'));
    } catch (error) {
        console.error('[ERROR] unreadCountController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const markReadController = async (req, res) => {
    try {
        const notification = await markNotificationReadService(
            req.params.notificationId,
            req.user.id
        );

        return res
            .status(StatusCodes.OK)
            .json(successResponse(notification, 'Notification marked as read'));
    } catch (error) {
        console.error('[ERROR] markReadController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const markAllReadController = async (req, res) => {
    try {
        const result = await markAllNotificationsReadService(req.user.id);
        return res
            .status(StatusCodes.OK)
            .json(successResponse(result, 'All notifications marked as read'));
    } catch (error) {
        console.error('[ERROR] markAllReadController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};
