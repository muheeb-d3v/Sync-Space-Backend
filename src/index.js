import './polyfill.js';
import express from 'express';
import { CLIENT_ORIGIN, ENV_FILE, ENV_FILE_SOURCE, PORT } from './config/serverConfig.js'
import connectDB, { isDatabaseConnected } from './config/dbConfig.js'
import apiRouter from './routes/apiRoutes.js'
import StatusCodes from 'http-status-codes'
import cors from 'cors'
import bullBoardApp from './server/bullboard.js'
import { Server } from 'socket.io'
import { createServer } from 'http'
import Redis from 'ioredis'
import redisConfig from './config/redisConfig.js'
import messageHandler from './controllers/channelSocketController.js'


const app = express()
const server = createServer(app)

const allowedOrigins = CLIENT_ORIGIN
  ? CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : '*'

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', apiRouter)
app.use(bullBoardApp)
app.get('/ping', (req, res) => {
  return res.status(StatusCodes.OK).json({ message: 'pong' })
})

// A standalone Redis client used for startup verification and health checks.
// Bull/ioredis creates its own shared connection for the mail queue; this
// client is only for reporting Redis availability.
export const redis = new Redis(redisConfig)
let redisConnected = false

redis.on('connect', () => {
  redisConnected = true
  console.log('[REDIS] Connected to Redis')
})
redis.on('error', (error) => {
  redisConnected = false
  console.error(`[REDIS] Connection error: ${error.message}`)
})

app.get('/health', (req, res) => {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected'
  const redisStatus = redisConnected ? 'connected' : 'disconnected'
  const healthy = isDatabaseConnected() && redisConnected
  return res.status(healthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
    status: healthy ? 'ok' : 'degraded',
    database,
    redis: redisStatus,
  })
})

io.on('connection', (socket) => {
  messageHandler(io , socket)
})

const start = async () => {
  console.log(`Env file: ${ENV_FILE} (${ENV_FILE_SOURCE})`)

  try {
    await connectDB()
  } catch (error) {
    console.error('='.repeat(72))
    console.error(`[DB] FATAL: ${error.message}`)
    console.error('[DB] The server starts, but every database request answers 503.')
    console.error('='.repeat(72))
  }

  // Verify Redis connectivity (non-fatal: Bull retries on its own).
  try {
    await redis.ping()
  } catch (error) {
    console.warn(`[REDIS] Could not ping Redis: ${error.message}`)
    console.warn('[REDIS] The server starts, but the mail queue will retry in the background.')
  }

  server.listen(PORT, () => {
    console.log(`Running on ${PORT}...`)
    console.log(`Allowed origins: ${Array.isArray(allowedOrigins) ? allowedOrigins.join(', ') : 'all'}`)
    console.log('For the UI, open http://localhost:3000/admin/queues')
  })
}

start()

