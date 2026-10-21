import { StatusCodes } from 'http-status-codes';

import { listDmsService, startDmService } from '../services/dmService.js';
import { customErrorResponse, successResponse } from '../utils/common/responseObjects.js';

export const listDmsController = async (req, res) => {
    try {
        const dms = await listDmsService(req.params.workspaceId, req.user.id);
        return res
            .status(StatusCodes.OK)
            .json(successResponse(dms, 'Direct messages fetched successfully'));
    } catch (error) {
        console.error('[ERROR] listDmsController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};

export const startDmController = async (req, res) => {
    try {
        const dm = await startDmService(
            req.params.workspaceId,
            req.user.id,
            req.body?.memberId
        );
        return res
            .status(StatusCodes.CREATED)
            .json(successResponse(dm, 'Direct message created successfully'));
    } catch (error) {
        console.error('[ERROR] startDmController:', error?.message || error);
        return res
            .status(error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
            .json(customErrorResponse(error));
    }
};
