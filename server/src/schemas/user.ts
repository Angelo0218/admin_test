import { z } from 'zod'
import { isCreatableRoleCode } from '../constants/roles'

export const userListQuerySchema = z.object({
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

export const userPasswordChangeSchema = z.object({
  currentPassword: z.string().min(6).max(64),
  newPassword: z.string().min(6).max(64),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
