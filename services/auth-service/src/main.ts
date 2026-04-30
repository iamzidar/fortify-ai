import Fastify from 'fastify'
import cors from '@fastify/cors'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config'
import { createSscSession, deleteSscSession } from './services/ssc-auth.service'
import { storeSession, getSession, deleteSession } from './services/session.service'
import { signAccessToken, signRefreshToken, verifyToken } from './services/jwt.service'
import type { LoginRequest, LoginResponse } from './types'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

async function start(): Promise<void> {
  await app.register(cors, { origin: false })

  app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }))

  // POST /login
  app.post<{ Body: LoginRequest }>('/login', async (req, reply) => {
    const { username, password } = req.body
    if (!username || !password) {
      return reply.code(400).send({ error: 'username and password required' })
    }

    const sessionId = uuidv4()
    const sessionName = `fortify-ai-${sessionId.substring(0, 8)}`

    try {
      await createSscSession(username, password, sessionName)
    } catch (err) {
      return reply.code(401).send({ error: (err as Error).message })
    }

    await storeSession(sessionId, {
      username,
      sessionName,
      sscUrl: config.sscServiceUrl,
      createdAt: Date.now(),
    })

    const accessToken = signAccessToken({
      userId: sessionId,
      username,
      sessionName,
      sscUrl: config.sscServiceUrl,
    })
    const refreshToken = signRefreshToken(sessionId)

    const response: LoginResponse = {
      accessToken,
      expiresIn: 15 * 60,
      user: { id: sessionId, username, sscUrl: config.sscServiceUrl, sessionName },
    }

    return reply.send({ ...response, refreshToken })
  })

  // DELETE /logout
  app.delete<{ Headers: { authorization?: string } }>('/logout', async (req, reply) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      try {
        const payload = verifyToken(token)
        await deleteSscSession(payload.sessionName)
        await deleteSession(payload.userId)
      } catch {
        // Best-effort
      }
    }
    return reply.send({ ok: true })
  })

  // POST /refresh
  app.post<{ Body: { refreshToken: string } }>('/refresh', async (req, reply) => {
    const { refreshToken } = req.body
    if (!refreshToken) return reply.code(400).send({ error: 'refreshToken required' })

    try {
      const payload = verifyToken(refreshToken) as unknown as { sessionId: string; type: string }
      if (payload.type !== 'refresh') throw new Error('Not a refresh token')

      const session = await getSession(payload.sessionId)
      if (!session) return reply.code(401).send({ error: 'Session expired' })

      const accessToken = signAccessToken({
        userId: payload.sessionId,
        username: session.username,
        sessionName: session.sessionName,
        sscUrl: session.sscUrl,
      })
      return reply.send({ accessToken, expiresIn: 15 * 60 })
    } catch {
      return reply.code(401).send({ error: 'Invalid refresh token' })
    }
  })

  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`auth-service running on port ${config.port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
