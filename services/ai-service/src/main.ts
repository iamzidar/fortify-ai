import Fastify from 'fastify'
import cors from '@fastify/cors'
import Redis from 'ioredis'
import { v4 as uuidv4 } from 'uuid'
import { config } from './config'
import { runChatStream } from './services/claude.service'
import type { ChatRequest } from './types'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

const redis = new Redis(config.redisUrl)

function internalAuthCheck(token: string | string[] | undefined): boolean {
  return token === config.internalSecret
}

async function start(): Promise<void> {
  await app.register(cors, { origin: false })

  app.get('/health', async () => ({ status: 'ok', service: 'ai-service' }))

  // POST /chat — SSE streaming endpoint
  app.post<{
    Body: ChatRequest
    Headers: {
      'x-internal-token': string
      'x-user-id': string
      'x-ssc-session': string
      'x-username'?: string
    }
  }>('/chat', async (req, reply) => {
    if (!internalAuthCheck(req.headers['x-internal-token'])) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }

    const userId = req.headers['x-user-id']
    const sessionName = req.headers['x-ssc-session']
    const username = req.headers['x-username'] ?? userId
    const { message, conversationId } = req.body

    if (!message?.trim()) {
      return reply.code(400).send({ error: 'message is required' })
    }

    const convId = conversationId ?? uuidv4()
    const historyKey = `chat:${userId}:${convId}`

    // Load conversation history from Redis
    const raw = await redis.get(historyKey)
    const history = raw ? (JSON.parse(raw) as Array<{ role: 'user' | 'assistant'; content: string }>) : []

    // Setup SSE response
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Conversation-Id': convId,
    })

    const sendEvent = (type: string, data: string): void => {
      reply.raw.write(`event: ${type}\ndata: ${JSON.stringify({ data })}\n\n`)
    }

    try {
      const updatedHistory = await runChatStream(
        message,
        history,
        sessionName,
        `https://fortify.kikoichi.dev/ssc`,
        username,
        ({ type, data }) => sendEvent(type, data),
      )

      // Persist updated history (cap at last 20 messages to control token usage)
      const trimmed = updatedHistory.slice(-20)
      await redis.setex(historyKey, 8 * 60 * 60, JSON.stringify(trimmed))
    } catch (err) {
      const e = err as Error & { cause?: Error; status?: number }
      const detail = e.cause?.message ?? (e.status ? `HTTP ${e.status}` : 'no detail')
      sendEvent('error', `${e.message} [${detail}]`)
    } finally {
      reply.raw.end()
    }
  })

  // DELETE /chat/:conversationId — clear conversation history
  app.delete<{
    Params: { conversationId: string }
    Headers: { 'x-internal-token': string; 'x-user-id': string }
  }>('/chat/:conversationId', async (req, reply) => {
    if (!internalAuthCheck(req.headers['x-internal-token'])) {
      return reply.code(401).send({ error: 'Unauthorized' })
    }
    const { conversationId } = req.params
    const userId = req.headers['x-user-id']
    await redis.del(`chat:${userId}:${conversationId}`)
    return reply.send({ ok: true })
  })

  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`ai-service running on port ${config.port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
