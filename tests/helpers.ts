import type { APIRequestContext } from '@playwright/test'

export const apiBase = process.env.API_BASE || 'http://localhost:8085/api/v1'

export async function login(request: APIRequestContext, username = 'admin', password = 'Aa123456') {
  const res = await request.post(`${apiBase}/auth/login`, {
    data: { username, password },
  })
  if (!res.ok()) {
    throw new Error(`login failed: ${res.status()}`)
  }
  const body = await res.json()
  return body.data.accessToken as string
}

export async function ensureKycApplication(
  request: APIRequestContext,
  token: string,
  status: string = 'PENDING',
) {
  const listRes = await request.get(`${apiBase}/kyc/applications`, {
    headers: authHeaders(token),
  })
  if (!listRes.ok()) {
    throw new Error(`kyc list failed: ${listRes.status()}`)
  }
  const listBody = await listRes.json()
  const items = listBody.data?.items || []
  const match = items.find(item => item.status === status)
  if (match?.id) {
    return match
  }

  const userRes = await request.get(`${apiBase}/user/detail`, {
    headers: authHeaders(token),
  })
  if (!userRes.ok()) {
    throw new Error(`user detail failed: ${userRes.status()}`)
  }
  const userBody = await userRes.json()
  const userId = userBody.data?.id
  if (!userId) {
    throw new Error('user id missing')
  }

  const createRes = await request.post(`${apiBase}/kyc/applications`, {
    headers: authHeaders(token),
    data: {
      userId,
      fullName: 'Test User',
      idNumber: `T${Date.now()}`,
      documentType: 'ID_CARD',
      phone: '0912345678',
      documents: [],
    },
  })
  if (!createRes.ok()) {
    throw new Error(`create kyc failed: ${createRes.status()}`)
  }
  const createBody = await createRes.json()
  const createdId = createBody.data?.id
  if (!createdId) {
    throw new Error('created kyc id missing')
  }
  return { id: createdId }
}

export function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}
