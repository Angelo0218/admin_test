import type { AuthPayload } from '../middlewares/auth'
import { findUserById, mapUserResponse } from '../models/user'

export async function getUserDetail(c) {
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  const data = mapUserResponse(user, auth.role)
  return c.json({ code: 0, message: 'ok', data })
}
