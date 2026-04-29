import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify'
import { config } from '../config'

export function internalAuthHook(
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): void {
  const token = req.headers['x-internal-token']
  if (token !== config.internalSecret) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }
  done()
}
