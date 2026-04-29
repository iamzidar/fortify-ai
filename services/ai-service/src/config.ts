export const config = {
  port: parseInt(process.env.PORT ?? '3004', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  anthropicModel: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
  sscServiceUrl: process.env.SSC_SERVICE_URL ?? 'http://localhost:3003',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret',
  maxConversationTokens: parseInt(process.env.MAX_CONVERSATION_TOKENS ?? '100000', 10),
} as const
