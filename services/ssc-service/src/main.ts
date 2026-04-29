import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config'
import { internalAuthHook } from './middleware/internal-auth'
import { sessionRoutes } from './routes/session'
import { applicationRoutes } from './routes/applications'
import { issueRoutes } from './routes/issues'
import { artifactRoutes } from './routes/artifacts'
import { executeRoutes } from './routes/execute'
import { FcliError } from './services/fcli.executor'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

async function start(): Promise<void> {
  await app.register(cors, { origin: false })

  // All routes require internal service token
  app.addHook('onRequest', internalAuthHook)

  // Health check (bypass internal auth via fastify hook order — registered before addHook)
  app.get('/health', async () => ({ status: 'ok', service: 'ssc-service' }))

  await app.register(sessionRoutes)
  await app.register(applicationRoutes)
  await app.register(issueRoutes)
  await app.register(artifactRoutes)
  await app.register(executeRoutes)

  // Global error handler for FcliError
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof FcliError) {
      return reply.code(err.code >= 400 && err.code < 600 ? err.code : 500).send({
        error: err.message,
        detail: err.stderr,
      })
    }
    app.log.error(err)
    return reply.code(500).send({ error: 'Internal server error' })
  })

  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`ssc-service running on port ${config.port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
