import { defineConfig } from '@playwright/test'

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3200)
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8085)

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'bun src/index.ts',
      cwd: './server',
      port: BACKEND_PORT,
      reuseExistingServer: false,
      env: {
        ENABLE_SEED: '1',
        DISABLE_RATE_LIMIT: '1',
        JWT_SECRET: 'test-secret',
        CORS_ORIGIN: `http://localhost:${FRONTEND_PORT}`,
        DATABASE_URL: 'file:./test.db?connection_limit=1',
        RESET_DB: '1',
      },
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host',
      port: FRONTEND_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
