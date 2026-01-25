import { z } from 'zod'
import { isCreatableRoleCode } from '../constants/roles'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const userListQuerySchema = paginationSchema.extend({
  keyword: z.string().optional(),
}).strict()

export const userCreateSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  displayName: z.string().min(1),
  roleCode: z.string().refine(isCreatableRoleCode, { message: 'role not allowed' }),
})

export const userDeleteSchema = z.object({
  adminPassword: z.string().min(1),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
