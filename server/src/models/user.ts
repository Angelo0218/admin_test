import type { Prisma } from '@prisma/client'
import { ROLE_CODES } from '../constants/roles'
import { prisma } from '../db/client'
import { hashPassword } from '../utils/password'

export interface UserListParams {
  keyword?: string
}

export interface UserCreateParams {
  username: string
  password: string
  displayName: string
  roleCode: string
}

const STAFF_ROLE_CODES = [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR]

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}

function mapRoles(user: NonNullable<Awaited<ReturnType<typeof findUserById>>>) {
  return user.roles.map(item => ({
    id: item.role.id,
    code: item.role.code,
    name: item.role.name,
  }))
}

export function mapUserResponse(user: NonNullable<Awaited<ReturnType<typeof findUserById>>>, currentRoleCode?: string) {
  const roles = mapRoles(user)

  const currentRole = currentRoleCode
    ? roles.find(role => role.code === currentRoleCode) || roles[0]
    : roles[0]

  return {
    id: user.id,
    username: user.username,
    status: user.status,
    profile: {
      avatar: user.avatar || '',
      nickName: user.displayName,
    },
    roles,
    currentRole,
  }
}

export function buildUserWhere({
  keyword,
  staffOnly = true,
}: {
  keyword?: string
  staffOnly?: boolean
} = {}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    status: { not: 'DELETED' },
  }

  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { displayName: { contains: keyword } },
    ]
  }

  where.roles = staffOnly
    ? { some: { role: { code: { in: STAFF_ROLE_CODES } } } }
    : { none: { role: { code: { in: STAFF_ROLE_CODES } } } }

  return where
}

export function buildUserDeleteData() {
  return {
    status: 'DELETED',
  }
}

export function canLoginWithStatus(status?: string) {
  return status !== 'DELETED'
}

export async function listUsers({ keyword }: UserListParams = {}) {
  const where = buildUserWhere({ keyword, staffOnly: true })
  const items = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      roles: {
        include: { role: true },
      },
    },
  })

  return {
    items: items.map(item => ({
      id: item.id,
      username: item.username,
      displayName: item.displayName,
      status: item.status,
      roles: mapRoles(item),
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

export async function createUserAccount({ username, password, displayName, roleCode }: UserCreateParams) {
  const passwordHash = await hashPassword(password)
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      displayName,
      roles: {
        create: [{ role: { connect: { code: roleCode } } }],
      },
    },
  })
}

export async function deleteUserAccount(id: string) {
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    return null
  }
  return prisma.user.update({
    where: { id },
    data: buildUserDeleteData(),
  })
}

export async function updateUserPassword(id: string, passwordHash: string) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}
