import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the backend package root from this file so the env file is found no
// matter which directory the process was started from (`node src/index.js`,
// `npm --prefix backend start`, pm2, Docker, ...).
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const ENV_FILE_BY_ENVIRONMENT = {
    production: '.env.production',
    development: '.env',
    test: '.env',
};

function readEnvFile(fileName) {
    const filePath = path.join(backendRoot, fileName);
    if (!fs.existsSync(filePath)) return {};

    try {
        return dotenv.parse(fs.readFileSync(filePath));
    } catch {
        return {};
    }
}

/**
 * Decide which env file to load.
 * 1. ENV_FILE            - explicit override
 * 2. process.env.NODE_ENV - provided by the shell / hosting platform
 * 3. NODE_ENV inside backend/.env
 * 4. backend/.env (development default)
 */
function resolveEnvFile() {
    if (process.env.ENV_FILE) {
        return { file: process.env.ENV_FILE, source: 'ENV_FILE' };
    }

    const hostNodeEnv = process.env.NODE_ENV;
    if (hostNodeEnv) {
        return {
            file: ENV_FILE_BY_ENVIRONMENT[hostNodeEnv] || '.env',
            source: `process.env.NODE_ENV=${hostNodeEnv}`,
        };
    }

    if (readEnvFile('.env').NODE_ENV === 'production') {
        return { file: '.env.production', source: 'NODE_ENV=production inside backend/.env' };
    }

    return { file: '.env', source: 'default (development)' };
}

const resolvedEnvFile = resolveEnvFile();

// Anything the host already exported always wins over the files.
const hostEnv = { ...process.env };

// Layer 1: backend/.env holds the shared defaults.
dotenv.config({ path: path.join(backendRoot, '.env') });

// Layer 2: the environment specific file overrides those defaults.
dotenv.config({
    path: path.join(backendRoot, resolvedEnvFile.file),
    override: true,
});

// Layer 3: restore the values the host had already defined.
Object.assign(process.env, hostEnv);

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const ENV_FILE = resolvedEnvFile.file;
export const ENV_FILE_SOURCE = resolvedEnvFile.source;
export const BACKEND_ROOT = backendRoot;

export const PORT = process.env.PORT || 3000;
export const DEV_DB_URL = process.env.DEV_DB_URL;
export const PROD_DB_URL = process.env.PROD_DB_URL;

// Production uses PROD_DB_URL, everything else uses DEV_DB_URL.
export const DB_URL_VARIABLE = NODE_ENV === 'production' ? 'PROD_DB_URL' : 'DEV_DB_URL';
export const DATABASE_URL = NODE_ENV === 'production' ? PROD_DB_URL : DEV_DB_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-env';
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || '1d';
export const MAIL_ID = process.env.MAIL_ID;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
export const REDIS_HOST = process.env.REDIS_HOST;
export const REDIS_PORT = process.env.REDIS_PORT;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
export const REDIS_URL = process.env.REDIS_URL;
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '';
