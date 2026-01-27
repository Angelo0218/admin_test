import { ROLE_CODES } from '../constants/roles'

export function isAdmin(role: string): boolean {
  return role === ROLE_CODES.ADMIN
}

export function isAuditor(role: string): boolean {
  return role === ROLE_CODES.AUDITOR
}

export function isSupport(role: string): boolean {
  return role === ROLE_CODES.SUPPORT
}
