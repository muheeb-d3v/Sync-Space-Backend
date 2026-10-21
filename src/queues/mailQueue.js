import Queue from 'bull'
import redisConfig from '../config/redisConfig.js'



const mailQueue = new Queue('mailQueue', {
  redis: redisConfig
});

// ioredis keeps retrying on its own, so the same error can arrive many times
// per second. Log it once per interval instead of flooding the console.
const REDIS_ERROR_LOG_INTERVAL_MS = 15000
let lastRedisErrorAt = 0

mailQueue.on('error', (err) => {
  const now = Date.now()
  if (now - lastRedisErrorAt < REDIS_ERROR_LOG_INTERVAL_MS) return
  lastRedisErrorAt = now
  console.error('[REDIS ERROR] mailQueue error:', err.message)
})

export default mailQueue
