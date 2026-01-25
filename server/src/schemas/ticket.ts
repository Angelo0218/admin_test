import { z } from 'zod'

const statusEnum = z.enum(['WAITING', 'IN_PROGRESS', 'CLOSED'])

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
