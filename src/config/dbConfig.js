import mongoose from 'mongoose';

import {
    DATABASE_URL,
    DB_URL_VARIABLE,
    ENV_FILE,
    NODE_ENV,
} from './serverConfig.js';

// Fail fast when the database is unreachable instead of queueing the query for
// 10 seconds and reporting "Operation `users.findOne()` buffering timed out
// after 10000ms".
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 10000);

const CONNECT_OPTIONS = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    autoIndex: NODE_ENV !== 'production',
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

let reconnectTimer = null;
let reconnectAttempts = 0;

const clearReconnectTimer = () => {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
};

/**
 * The driver gives up on a cluster whose hostname no longer resolves, so keep
 * retrying with a backoff. The server heals by itself as soon as MongoDB is
 * reachable again (cluster restored, DNS fixed, VPN back online, ...).
 */
const scheduleReconnect = () => {
    if (reconnectTimer) return;

    const delay = Math.min(30000, 1000 * 2 ** Math.min(reconnectAttempts, 5));
    reconnectAttempts += 1;

    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;

        if (mongoose.connection.readyState !== 0) return;

        try {
            await mongoose.connect(DATABASE_URL, CONNECT_OPTIONS);
            reconnectAttempts = 0;
            console.log('[DB] Reconnected to MongoDB');
        } catch (error) {
            console.warn(`[DB] Reconnect attempt failed: ${error.message}`);
            scheduleReconnect();
        }
    }, delay);

    // Never keep the process alive just for a reconnect attempt.
    reconnectTimer.unref?.();
};

export default async function connectDB() {
    if (!DATABASE_URL) {
        throw new Error(
            `[DB] ${DB_URL_VARIABLE} is missing. Add it to backend/${ENV_FILE} ` +
                `(or export ${DB_URL_VARIABLE} in the environment) and restart the server.`
        );
    }

    mongoose.connection.on('connected', () => {
        reconnectAttempts = 0;
        console.log('[DB] Connected to MongoDB');
    });
    mongoose.connection.on('error', (error) => {
        console.error(`[DB] Connection error: ${error.message}`);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('[DB] Disconnected from MongoDB - retrying in the background');
        scheduleReconnect();
    });

    try {
        await mongoose.connect(DATABASE_URL, CONNECT_OPTIONS);

        console.log(`[DB] MongoDB ready (${NODE_ENV})`);
        return true;
    } catch (error) {
        console.error(`[DB] Failed to connect to MongoDB: ${error.message}`);
        console.error('[DB] Retrying in the background until the database is reachable.');
        scheduleReconnect();
        throw error;
    }
}
