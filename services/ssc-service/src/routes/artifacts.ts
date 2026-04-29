import type { FastifyInstance } from 'fastify'
import { runSscCommand } from '../services/fcli.executor'

export async function artifactRoutes(app: FastifyInstance): Promise<void> {
  // GET /artifacts?av=<versionId>
  app.get<{
    Querystring: { av: string; maxResults?: string }
    Headers: { 'x-ssc-session': string }
  }>('/artifacts', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const { av, maxResults } = req.query
    if (!av) return reply.code(400).send({ error: 'av (appversion id) is required' })

    const args = ['artifact', 'list', '--av', av]
    if (maxResults) args.push('--max-results', maxResults)
    const data = await runSscCommand(args, sessionName)
    return reply.send(data)
  })
}
