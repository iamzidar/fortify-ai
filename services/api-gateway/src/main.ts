import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import httpProxy from '@fastify/http-proxy'
import Redis from 'ioredis'
import type { JwtPayload } from '@fortify-ai/types'
import { config } from './config'
import { jwtVerifyHook } from './plugins/jwt-verify'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

const redis = new Redis(config.redisUrl)

async function start(): Promise<void> {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  await app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
    redis,
    keyGenerator: (req) => {
      const user = (req as FastifyRequest & { user?: JwtPayload }).user
      return user?.userId ?? req.ip
    },
  })

  app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }))

  // JWT verification for all non-public routes
  app.addHook('onRequest', jwtVerifyHook)

  // Inject internal token + user context headers for downstream services
  function injectHeaders(req: import('fastify').FastifyRequest): void {
    const user = (req as FastifyRequest & { user?: JwtPayload }).user
    req.headers['x-internal-token'] = config.internalSecret
    if (user) {
      req.headers['x-user-id'] = user.userId
      req.headers['x-ssc-session'] = user.sessionName
    }
  }

  // Auth routes — no JWT required (login/logout/refresh)
  await app.register(httpProxy, {
    upstream: config.services.auth,
    prefix: '/api/auth',
    rewritePrefix: '',
    httpMethods: ['GET', 'POST', 'DELETE'],
    preHandler: (req, _reply, done) => {
      req.headers['x-internal-token'] = config.internalSecret
      done()
    },
  })

  // SSC routes
  await app.register(httpProxy, {
    upstream: config.services.ssc,
    prefix: '/api/ssc',
    rewritePrefix: '',
    preHandler: (req, _reply, done) => {
      injectHeaders(req)
      done()
    },
  })

  // Dashboard routes
  await app.register(httpProxy, {
    upstream: config.services.dashboard,
    prefix: '/api/dashboard',
    rewritePrefix: '',
    preHandler: (req, _reply, done) => {
      injectHeaders(req)
      done()
    },
  })

  // AI / Chat routes — SSE streaming (must not buffer)
  await app.register(httpProxy, {
    upstream: config.services.ai,
    prefix: '/api/ai',
    rewritePrefix: '',
    preHandler: (req, _reply, done) => {
      injectHeaders(req)
      done()
    },
  })

  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`api-gateway running on port ${config.port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
