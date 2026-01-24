import { defineConfig } from '@playwright/test'

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3200)
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8085)

export default defineConfig({
  testDir: './tests',
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
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --host',
      port: FRONTEND_PORT,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
