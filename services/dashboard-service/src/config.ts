export const config = {
  port: parseInt(process.env.PORT ?? '3005', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  sscServiceUrl: process.env.SSC_SERVICE_URL ?? 'http://localhost:3003',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret',
  cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS ?? '60', 10),
} as const
