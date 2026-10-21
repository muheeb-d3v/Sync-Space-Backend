import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_URL } from "./serverConfig.js";

const redisConfig = REDIS_URL
    ? REDIS_URL
    : {
        host: REDIS_HOST || 'localhost',
        port: REDIS_PORT ? Number(REDIS_PORT) : 6379,
        ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {})
    };

export default redisConfig;