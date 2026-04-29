import type { FastifyInstance } from 'fastify'
import { runSscCommand } from '../services/fcli.executor'

export async function issueRoutes(app: FastifyInstance): Promise<void> {
  // GET /issues?av=<versionId>&q=<spel>&maxResults=<n>
  app.get<{
    Querystring: { av: string; q?: string; maxResults?: string }
    Headers: { 'x-ssc-session': string }
  }>('/issues', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const { av, q, maxResults } = req.query
    if (!av) return reply.code(400).send({ error: 'av (appversion id) is required' })

    const args = ['issue', 'list', '--av', av]
    if (q) args.push('--query', q)
    if (maxResults) args.push('--max-results', maxResults)
    const data = await runSscCommand(args, sessionName)
    return reply.send(data)
  })

  // GET /issues/count?av=<versionId>&groupBy=friority
  app.get<{
    Querystring: { av: string; groupBy?: string }
    Headers: { 'x-ssc-session': string }
  }>('/issues/count', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const { av, groupBy } = req.query
    if (!av) return reply.code(400).send({ error: 'av (appversion id) is required' })

    const args = ['issue', 'count', '--av', av]
    if (groupBy) args.push('--group-by', groupBy)
    const data = await runSscCommand(args, sessionName)
    return reply.send(data)
  })
}
