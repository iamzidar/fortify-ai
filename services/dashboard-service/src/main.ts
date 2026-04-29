import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config'
import { cached } from './services/cache.service'
import { listApplications, listVersions, getIssueCount, getRecentArtifacts } from './services/ssc.client'
import { internalAuthHook } from './middleware/internal-auth'

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
  },
})

async function start(): Promise<void> {
  await app.register(cors, { origin: false })
  app.addHook('onRequest', internalAuthHook)

  app.get('/health', async () => ({ status: 'ok', service: 'dashboard-service' }))

  // GET /overview — aggregate vulnerability counts across all app versions
  app.get<{ Headers: { 'x-ssc-session': string; 'x-user-id': string } }>(
    '/overview',
    async (req, reply) => {
      const sessionName = req.headers['x-ssc-session']
      const userId = req.headers['x-user-id']
      const cacheKey = `dashboard:${userId}:overview`

      const data = await cached(cacheKey, config.cacheTtl, async () => {
        const apps = await listApplications(sessionName) as Array<{ id: string }>
        let critical = 0, high = 0, medium = 0, low = 0
        let totalVersions = 0

        await Promise.all(
          apps.slice(0, 20).map(async (app) => {
            const versions = await listVersions(String(app.id), sessionName) as Array<{ id: string }>
            totalVersions += versions.length
            await Promise.all(
              versions.slice(0, 5).map(async (v) => {
                try {
                  const counts = await getIssueCount(String(v.id), sessionName)
                  critical += counts['Critical'] ?? 0
                  high += counts['High'] ?? 0
                  medium += counts['Medium'] ?? 0
                  low += counts['Low'] ?? 0
                } catch { /* version may have no issues */ }
              }),
            )
          }),
        )

        return {
          totalApplications: apps.length,
          totalVersions,
          issueCounts: { Critical: critical, High: high, Medium: medium, Low: low, total: critical + high + medium + low },
          lastUpdated: new Date().toISOString(),
        }
      })

      return reply.send(data)
    },
  )

  // GET /applications — list with per-app vulnerability summary
  app.get<{ Headers: { 'x-ssc-session': string; 'x-user-id': string } }>(
    '/applications',
    async (req, reply) => {
      const sessionName = req.headers['x-ssc-session']
      const userId = req.headers['x-user-id']
      const cacheKey = `dashboard:${userId}:applications`

      const data = await cached(cacheKey, config.cacheTtl, () =>
        listApplications(sessionName),
      )
      return reply.send(data)
    },
  )

  // GET /applications/:appId/posture
  app.get<{
    Params: { appId: string }
    Headers: { 'x-ssc-session': string; 'x-user-id': string }
  }>('/applications/:appId/posture', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const userId = req.headers['x-user-id']
    const { appId } = req.params
    const cacheKey = `dashboard:${userId}:app:${appId}`

    const data = await cached(cacheKey, config.cacheTtl, async () => {
      const versions = await listVersions(appId, sessionName) as Array<{ id: string }>
      const postures = await Promise.all(
        versions.map(async (v) => {
          const [counts, artifacts] = await Promise.allSettled([
            getIssueCount(String(v.id), sessionName),
            getRecentArtifacts(String(v.id), sessionName),
          ])
          return {
            version: v,
            issueCounts: counts.status === 'fulfilled' ? counts.value : {},
            recentArtifact: artifacts.status === 'fulfilled' ? (artifacts.value as unknown[])[0] : null,
          }
        }),
      )
      return { appId, versions: postures }
    })

    return reply.send(data)
  })

  // GET /scans/recent — recent artifacts across all apps
  app.get<{
    Querystring: { av: string }
    Headers: { 'x-ssc-session': string; 'x-user-id': string }
  }>('/scans/recent', async (req, reply) => {
    const sessionName = req.headers['x-ssc-session']
    const userId = req.headers['x-user-id']
    const { av } = req.query
    if (!av) return reply.code(400).send({ error: 'av required' })

    const cacheKey = `dashboard:${userId}:scans:${av}`
    const data = await cached(cacheKey, config.cacheTtl, () =>
      getRecentArtifacts(av, sessionName),
    )
    return reply.send(data)
  })

  await app.listen({ port: config.port, host: '0.0.0.0' })
  app.log.info(`dashboard-service running on port ${config.port}`)
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
