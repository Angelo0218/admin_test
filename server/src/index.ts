import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './config/env'
import { errorHandler } from './middlewares/error'
import { seedDefaults } from './models/seed'
import { authRoutes } from './routes/auth'
import { kycRoutes } from './routes/kyc'
import { permissionRoutes } from './routes/permission'
import { userRoutes } from './routes/user'

const app = new Hono()

app.use('*', cors({ origin: env.corsOrigin, credentials: true }))
app.use('*', logger())

app.onError(errorHandler)
app.notFound(c => c.json({ code: 404, message: 'not found', data: null }, 404))

app.get('/', c => c.json({ code: 0, message: 'ok', data: { service: 'kyc-api' } }))

app.route('/api/v1', authRoutes)
app.route('/api/v1', userRoutes)
app.route('/api/v1', permissionRoutes)
app.route('/api/v1', kycRoutes)

async function start() {
  await seedDefaults()
  const bun = globalThis.Bun
  if (!bun) {
    throw new Error('Bun runtime is required to start the server.')
  }
  bun.serve({
    fetch: app.fetch,
    port: env.port,
  })
  console.warn(`[server] listening on http://localhost:${env.port}`)
}

void start()
