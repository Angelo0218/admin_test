import type { Context } from 'hono'
import type { AuthPayload } from '../middlewares/auth'

export type AppContext = Context<{
  Variables: {
    user?: AuthPayload
    validatedBody?: unknown
    validatedParams?: unknown
    requestId?: string
  }
}>
