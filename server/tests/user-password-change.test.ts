import path from 'node:path'
import { afterEach, expect, test } from 'bun:test'
import { Hono } from 'hono'

const originalDatabaseUrl = process.env.DATABASE_URL

afterEach(() => {
  if (typeof originalDatabaseUrl === 'undefined') {
    delete process.env.DATABASE_URL
  }
  else {
    process.env.DATABASE_URL = originalDatabaseUrl
  }
})

test('changes password when current password is valid', async () => {
  const databasePath = path.resolve('prisma', 'test.db').replace(/\\/g, '/')
  process.env.DATABASE_URL = `file:${databasePath}`

  const [{ hashPassword, verifyPassword }, { prisma }, { changePasswordHandler }, { validateJson }, { userPasswordChangeSchema }] = await Promise.all([
    import(`../src/utils/password?test=${Date.now()}`),
    import(`../src/db/client?test=${Date.now()}`),
    import(`../src/controllers/user?test=${Date.now()}`),
    import(`../src/middlewares/validate?test=${Date.now()}`),
    import(`../src/schemas/user?test=${Date.now()}`),
  ])

  const user = await prisma.user.create({
    data: {
      username: `user_${Date.now()}`,
      passwordHash: await hashPassword('OldPass123'),
      displayName: 'Test User',
    },
  })

  const app = new Hono()
  app.use('/user/password', async (c, next) => {
    c.set('user', { userId: user.id, role: 'ADMIN', username: user.username })
    await next()
  })
  app.post('/user/password', validateJson(userPasswordChangeSchema), changePasswordHandler)

  const res = await app.request('/user/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'OldPass123', newPassword: 'NewPass123' }),
  })

  const body = await res.json()

  try {
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBe(true)

    const updated = await prisma.user.findUnique({ where: { id: user.id } })
    expect(updated).not.toBeNull()
    expect(await verifyPassword('NewPass123', updated!.passwordHash)).toBe(true)
  }
  finally {
    await prisma.auditLog.deleteMany({ where: { actorId: user.id } })
    await prisma.userRole.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.$disconnect()
  }
})

test('rejects change when current password is invalid', async () => {
  const databasePath = path.resolve('prisma', 'test.db').replace(/\\/g, '/')
  process.env.DATABASE_URL = `file:${databasePath}`

  const [{ hashPassword }, { prisma }, { changePasswordHandler }, { validateJson }, { userPasswordChangeSchema }] = await Promise.all([
    import(`../src/utils/password?test=${Date.now()}`),
    import(`../src/db/client?test=${Date.now()}`),
    import(`../src/controllers/user?test=${Date.now()}`),
    import(`../src/middlewares/validate?test=${Date.now()}`),
    import(`../src/schemas/user?test=${Date.now()}`),
  ])

  const user = await prisma.user.create({
    data: {
      username: `user_${Date.now()}`,
      passwordHash: await hashPassword('OldPass123'),
      displayName: 'Test User',
    },
  })

  const app = new Hono()
  app.use('/user/password', async (c, next) => {
    c.set('user', { userId: user.id, role: 'ADMIN', username: user.username })
    await next()
  })
  app.post('/user/password', validateJson(userPasswordChangeSchema), changePasswordHandler)

  const res = await app.request('/user/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'WrongPass123', newPassword: 'NewPass123' }),
  })

  const body = await res.json()

  try {
    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error?.message).toBe('invalid current password')
  }
  finally {
    await prisma.auditLog.deleteMany({ where: { actorId: user.id } })
    await prisma.userRole.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.$disconnect()
  }
})
