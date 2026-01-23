import { z } from 'zod'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const auditListQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  targetType: z.string().optional(),
  keyword: z.string().optional(),
})
