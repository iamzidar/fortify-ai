import type { FastifyInstance } from 'fastify'
import { runFcli, validateArgs, FcliError } from '../services/fcli.executor'

// Generic fcli executor for AI Service — validates args before running
export async function executeRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: { args: string[] }
    Headers: { 'x-ssc-session': string }
  }>('/execute', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const { args } = req.body

    if (!Array.isArray(args) || args.length === 0) {
      return reply.code(400).send({ error: 'args array is required' })
    }

    try {
      validateArgs(args)
    } catch (err) {
      if (err instanceof FcliError) {
        return reply.code(err.code).send({ error: err.message })
      }
      throw err
    }

    const withJson = args.includes('-o') || args.includes('--output')
      ? args
      : [...args, '-o', 'json']

    const data = await runFcli(withJson, sessionName)
    return reply.send({ result: data })
  })
}
