export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-prod',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  services: {
    auth: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3002',
    ssc: process.env.SSC_SERVICE_URL ?? 'http://localhost:3003',
    ai: process.env.AI_SERVICE_URL ?? 'http://localhost:3004',
    dashboard: process.env.DASHBOARD_SERVICE_URL ?? 'http://localhost:3005',
  },
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret',
} as const
