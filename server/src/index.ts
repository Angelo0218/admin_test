import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './config/env'
import { errorHandler } from './middlewares/error'
import { seedDefaults } from './models/seed'
import { auditRoutes } from './routes/audit'
import { authRoutes } from './routes/auth'
import { kycRoutes } from './routes/kyc'
import { roleRoutes } from './routes/role'
import { ticketRoutes } from './routes/ticket'
import { userRoutes } from './routes/user'
import { isOriginAllowed, resolveCorsOrigin } from './utils/cors'

const app = new Hono()

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin')
  if (origin && !isOriginAllowed(origin, env.corsOrigin)) {
    return c.json({ code: 403, message: 'cors origin not allowed', data: null }, 403)
  }
  await next()
})
app.use('*', cors({
  origin: origin => resolveCorsOrigin(origin, env.corsOrigin),
  credentials: true,
}))
app.use('*', logger())

app.onError(errorHandler)
app.notFound(c => c.json({ code: 404, message: 'not found', data: null }, 404))

app.get('/', c => c.json({ code: 0, message: 'ok', data: { service: 'kyc-api' } }))

app.route('/api/v1', authRoutes)
app.route('/api/v1', userRoutes)
app.route('/api/v1', kycRoutes)
app.route('/api/v1', ticketRoutes)
app.route('/api/v1', auditRoutes)
app.route('/api/v1', roleRoutes)

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
