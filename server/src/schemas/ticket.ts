import { z } from 'zod'

const statusEnum = z.enum(['WAITING', 'IN_PROGRESS', 'CLOSED'])

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const ticketListQuerySchema = paginationSchema.extend({
  status: statusEnum.optional(),
  category: z.string().optional(),
  keyword: z.string().optional(),
})

export const ticketCreateSchema = z.object({
  requesterId: z.string().min(1),
  subject: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  internalNote: z.string().optional(),
})

export const ticketReplySchema = z.object({
  message: z.string().min(1),
})

export const ticketStatusSchema = z.object({
  status: statusEnum,
})

export const ticketUpdateSchema = z.object({
  tags: z.array(z.string()).optional(),
  internalNote: z.string().optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
