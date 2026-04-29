export const config = {
  port: parseInt(process.env.PORT ?? '3003', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  fcliHome: process.env.FCLI_HOME ?? `${process.env.HOME}/.fcli`,
  sscUrl: process.env.FCLI_DEFAULT_SSC_URL ?? 'https://fortify.kikoichi.dev/ssc',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-internal-secret',
  allowedFcliSubcommands: ['ssc'] as const,
} as const
