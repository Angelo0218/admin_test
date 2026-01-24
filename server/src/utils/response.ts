import type { Context } from 'hono'

interface ApiError {
  code: number
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiError | null
  requestId?: string
}

function buildResponse<T>(c: Context, response: ApiResponse<T>, status: number) {
  const requestId = c.get('requestId')
  if (requestId)
    response.requestId = requestId
  return c.json(response, status)
}

export function ok<T>(c: Context, data: T, status = 200) {
  return buildResponse(c, { success: true, data, error: null }, status)
}

export function fail(c: Context, code: number, message: string, status = code) {
  return buildResponse(c, { success: false, data: null, error: { code, message } }, status)
}
