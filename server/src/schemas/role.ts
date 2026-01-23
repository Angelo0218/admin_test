import { z } from 'zod'

export const rolePermissionSchema = z.object({
  permissionCodes: z.array(z.string().min(1)).min(1),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
