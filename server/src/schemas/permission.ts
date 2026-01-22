import { z } from 'zod'

export const permissionValidateSchema = z.object({
  path: z.string().min(1),
})
