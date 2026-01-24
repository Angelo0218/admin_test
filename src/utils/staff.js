import { ROLE_CODES } from '../constants/roles.js'

const STAFF_ROLE_SET = new Set([
  ROLE_CODES.ADMIN,
  ROLE_CODES.SUPPORT,
  ROLE_CODES.AUDITOR,
])

export function isStaffUser(user) {
  return Boolean(user?.roles?.some(role => STAFF_ROLE_SET.has(role.code)))
}

export function filterStaffUsers(rows) {
  if (!Array.isArray(rows)) {
    return []
  }
  return rows.filter(isStaffUser)
}

export function getStaffRoleOptions(roleLabel) {
  const label = typeof roleLabel === 'function'
    ? roleLabel
    : code => code
  return [
    { label: label(ROLE_CODES.SUPPORT), value: ROLE_CODES.SUPPORT },
    { label: label(ROLE_CODES.AUDITOR), value: ROLE_CODES.AUDITOR },
  ]
}

export function validateStaffCreateInput(payload) {
  const username = typeof payload?.username === 'string' ? payload.username.trim() : ''
  if (username.length < 3) {
    return 'users.create.usernameTooShort'
  }
  const displayName = typeof payload?.displayName === 'string' ? payload.displayName.trim() : ''
  if (!displayName) {
    return 'users.create.displayNameRequired'
  }
  const password = typeof payload?.password === 'string' ? payload.password : ''
  if (password.length < 6) {
    return 'users.create.passwordTooShort'
  }
  const roleCode = payload?.roleCode
  if (!roleCode) {
    return 'users.create.roleRequired'
  }
  return ''
}
