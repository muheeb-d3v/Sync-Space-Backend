import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { customErrorResponse } from '../utils/common/responseObjects.js';

/**
 * Rejects requests that need the database while the connection is down with a
 * clear 503 instead of letting Mongoose buffer the query until it times out.
 */
export const requireDatabase = (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        return next();
    }

    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json(
        customErrorResponse({
            explanation: 'The database is not connected',
            message: 'The database connection is not available. Please retry in a moment.',
            statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        })
    );
};
