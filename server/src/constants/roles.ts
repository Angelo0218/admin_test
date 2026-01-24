export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  AUDITOR: 'AUDITOR',
  SUPPORT: 'SUPPORT',
} as const

export type RoleCode = typeof ROLE_CODES[keyof typeof ROLE_CODES]

const ROLE_CODE_SET = new Set(Object.values(ROLE_CODES))
const CREATABLE_ROLE_SET = new Set([ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR])

export function isRoleCode(value: string): value is RoleCode {
  return ROLE_CODE_SET.has(value as RoleCode)
}

export function isCreatableRoleCode(value: string): value is RoleCode {
  return CREATABLE_ROLE_SET.has(value as RoleCode)
}
