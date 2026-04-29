import type { FastifyInstance } from 'fastify'
import { runFcli, FcliError } from '../services/fcli.executor'
import { config } from '../config'

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // POST /session/login — create named fcli SSC session for a user
  app.post<{
    Body: { username: string; password: string; sessionName: string }
  }>('/session/login', async (req, reply) => {
    const { username, password, sessionName } = req.body
    if (!username || !password || !sessionName) {
      return reply.code(400).send({ error: 'username, password and sessionName required' })
    }
    try {
      await runFcli([
        'ssc', 'session', 'login',
        '--url', config.sscUrl,
        '--user', username,
        '--password', password,
        `--ssc-session=${sessionName}`,
      ])
      return reply.send({ ok: true, sessionName })
    } catch (err) {
      if (err instanceof FcliError) {
        return reply.code(401).send({ error: 'SSC login failed', detail: err.stderr })
      }
      throw err
    }
  })

  // DELETE /session/:sessionName — logout and destroy fcli session
  app.delete<{
    Params: { sessionName: string }
  }>('/session/:sessionName', async (req, reply) => {
    const { sessionName } = req.params
    try {
      await runFcli(['ssc', 'session', 'logout', `--ssc-session=${sessionName}`, '--no-revoke-token'])
    } catch {
      // Best-effort: ignore logout errors (session may have already expired)
    }
    return reply.send({ ok: true })
  })

  // GET /session/:sessionName/validate — check if session is still active
  app.get<{
    Params: { sessionName: string }
  }>('/session/:sessionName/validate', async (req, reply) => {
    try {
      await runFcli(['ssc', 'session', 'ls', '--validate', `--ssc-session=${sessionName}`])
      return reply.send({ valid: true })
    } catch {
      return reply.code(401).send({ valid: false })
    }
  })
}
