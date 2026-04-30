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
  // appId can be numeric ID or app name — fcli appversion list has no --app filter,
  // so we fetch all versions and filter by application.id or application.name
  app.get<{
    Params: { appId: string }
    Headers: { 'x-ssc-session': string }
  }>('/applications/:appId/versions', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const all = await runSscCommand(['appversion', 'list'], sessionName) as Array<Record<string, unknown>>
    const { appId } = req.params
    const isNumeric = /^\d+$/.test(appId)
    const versions = all.filter((v) => {
      const app = v['application'] as Record<string, unknown> | undefined
      if (!app) return false
      return isNumeric
        ? String(app['id']) === appId
        : String(app['name']).toLowerCase() === appId.toLowerCase()
    })
    return reply.send(versions)
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
