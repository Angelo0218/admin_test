const envSource = globalThis.Bun?.env ?? globalThis.process?.env ?? {}

export const env = {
  port: Number(envSource.PORT ?? 8085),
  jwtSecret: envSource.JWT_SECRET ?? 'dev-secret',
  jwtExpiresIn: envSource.JWT_EXPIRES_IN ?? '1h',
  jwtRefreshExpiresIn: envSource.JWT_REFRESH_EXPIRES_IN ?? '7d',
  corsOrigin: envSource.CORS_ORIGIN ?? '*',
  databaseUrl: envSource.DATABASE_URL ?? 'file:./dev.db',
  debugAuth: envSource.DEBUG_AUTH === '1',
}
