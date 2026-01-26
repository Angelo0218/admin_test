function resolveEnv() {
  const envSource = globalThis.process?.env ?? globalThis.Bun?.env ?? {}
  const nodeEnv = envSource.NODE_ENV ?? 'development'
  const isTest = nodeEnv === 'test'
  const isCi = envSource.CI === 'true' || envSource.CI === '1'
  const isProduction = nodeEnv === 'production' || (!isTest && isCi)

  if (isProduction && !envSource.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production/CI')
  }

  return {
    port: Number(envSource.PORT ?? 8085),
    jwtSecret: envSource.JWT_SECRET ?? '',
    jwtExpiresIn: envSource.JWT_EXPIRES_IN ?? '1h',
    jwtRefreshExpiresIn: envSource.JWT_REFRESH_EXPIRES_IN ?? '7d',
    corsOrigin: envSource.CORS_ORIGIN ?? '',
    databaseUrl: envSource.DATABASE_URL ?? 'file:./dev.db',
    enableSeed: envSource.ENABLE_SEED === 'true' || envSource.ENABLE_SEED === '1',
    resetDatabase: envSource.RESET_DB === 'true' || envSource.RESET_DB === '1',
    debugAuth: envSource.DEBUG_AUTH === '1',
    isProduction,
  }
}

type Env = ReturnType<typeof resolveEnv>

void resolveEnv()

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    return resolveEnv()[prop]
  },
})
