import { z } from 'zod'

const statusEnum = z.enum(['ACTIVE', 'DISABLED'])

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const userListQuerySchema = paginationSchema.extend({
  status: statusEnum.optional(),
  keyword: z.string().optional(),
})

export const userDisableSchema = z.object({
  reason: z.string().min(1),
})

export const userResetPasswordSchema = z.object({
  password: z.string().min(1).optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
