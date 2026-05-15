import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth.js'
import { jobsRoutes } from './routes/jobs.js'
import { seekerRoutes } from './routes/seeker.js'
import { employerRoutes } from './routes/employer.js'
import { aiRoutes } from './routes/ai.js'
import { adminRoutes } from './routes/admin.js'
import { startScheduler } from './services/scheduler.js'

const app = Fastify({ logger: false })

async function main() {
  await app.register(helmet, { contentSecurityPolicy: false })

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin.includes('localhost') || origin.includes('vercel.app') || origin.includes('onrender.com')) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ error: 'Too many requests' })
  })

  app.get('/health', async () => ({
    status: 'ok',
    service: 'NexaWork API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }))

  await app.register(authRoutes)
  await app.register(jobsRoutes)
  await app.register(seekerRoutes)
  await app.register(employerRoutes)
  await app.register(aiRoutes)
  await app.register(adminRoutes)

  app.setErrorHandler((error, _request, reply) => {
    console.error('API Error:', error)
    reply.status(error.statusCode ?? 500).send({
      error: error.message || 'Internal server error'
    })
  })

  const port = parseInt(process.env.PORT || '3001')
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`\n🚀 NexaWork API running on http://localhost:${port}`)
  console.log(`📋 Health: http://localhost:${port}/health\n`)
  startScheduler()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
