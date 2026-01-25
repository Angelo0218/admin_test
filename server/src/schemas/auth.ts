import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[\w.-]+$/),
  password: z.string().min(6).max(64),
})

export const roleToggleSchema = z.object({
  role: z.enum(['ADMIN', 'SUPPORT', 'AUDITOR']),
})
