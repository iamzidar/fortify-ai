import type { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'
import { config } from '../config'

// Routes that do not require authentication
const PUBLIC_PATHS = ['/api/auth/login', '/health']

export async function jwtVerifyHook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const path = req.url.split('?')[0]
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (!token) {
    return reply.code(401).send({ error: 'Missing authorization token' })
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
    // Attach user context to request for downstream injection
    ;(req as FastifyRequest & { user: JwtPayload }).user = payload
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' })
  }
}
