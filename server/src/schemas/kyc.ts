import { z } from 'zod'

const statusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'RESET'])

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const kycListQuerySchema = paginationSchema.extend({
  status: statusEnum.optional(),
  assignedTo: z.enum(['me']).optional(),
})

export const kycHistoryQuerySchema = paginationSchema.extend({
  status: z.enum(['APPROVED', 'REJECTED', 'RESET']).optional(),
  auditorId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  keyword: z.string().optional(),
})

export const auditSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
})

export const assignSchema = z.object({
  auditorId: z.string().min(1),
})

export const resetSchema = z.object({
  reason: z.string().min(1),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
