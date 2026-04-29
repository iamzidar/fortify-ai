export const config = {
  port: parseInt(process.env.PORT ?? '3002', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-prod',
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '8h',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  sscServiceUrl: process.env.SSC_SERVICE_URL ?? 'http://localhost:3003',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret',
} as const
