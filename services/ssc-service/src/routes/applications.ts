import type { FastifyInstance } from 'fastify'
import { runSscCommand } from '../services/fcli.executor'

export async function applicationRoutes(app: FastifyInstance): Promise<void> {
  // GET /applications?q=<query>
  app.get<{
    Querystring: { q?: string; maxResults?: string }
    Headers: { 'x-ssc-session': string }
  }>('/applications', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const args = ['app', 'list']
    if (req.query.q) args.push('--query', req.query.q)
    if (req.query.maxResults) args.push('--max-results', req.query.maxResults)
    const data = await runSscCommand(args, sessionName)
    return reply.send(data)
  })

  // GET /applications/:appId/versions
  app.get<{
    Params: { appId: string }
    Querystring: { q?: string }
    Headers: { 'x-ssc-session': string }
  }>('/applications/:appId/versions', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const args = ['appversion', 'list', '--app', req.params.appId]
    if (req.query.q) args.push('--query', req.query.q)
    const data = await runSscCommand(args, sessionName)
    return reply.send(data)
  })

  // GET /applications/:appId/versions/:versionId
  app.get<{
    Params: { appId: string; versionId: string }
    Headers: { 'x-ssc-session': string }
  }>('/applications/:appId/versions/:versionId', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const data = await runSscCommand(
      ['appversion', 'get', '--av', req.params.versionId],
      sessionName,
    )
    return reply.send(data)
  })
}
