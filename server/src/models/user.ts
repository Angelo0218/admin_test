import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'

export interface UserListParams {
  status?: string
  keyword?: string
  page: number
  pageSize: number
}

export interface UserDisableParams {
  id: string
  reason: string
}

export interface UserEnableParams {
  id: string
}

export interface UserResetPasswordParams {
  id: string
  password: string
}

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
    disabledReason: user.disabledReason || undefined,
    profile: {
      avatar: user.avatar || '',
      nickName: user.displayName,
    },
    roles,
    currentRole,
  }
}

export async function listUsers({ status, keyword, page, pageSize }: UserListParams) {
  const where: Prisma.UserWhereInput = {}
  if (status) {
    where.status = status
  }
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { displayName: { contains: keyword } },
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: { role: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    items: items.map(item => ({
      id: item.id,
      username: item.username,
      displayName: item.displayName,
      status: item.status,
      roles: mapRoles(item),
      createdAt: item.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
  }
}

export async function disableUser({ id, reason }: UserDisableParams) {
  return prisma.user.update({
    where: { id },
    data: {
      status: 'DISABLED',
      disabledReason: reason,
    },
  })
}

export async function enableUser({ id }: UserEnableParams) {
  return prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      disabledReason: null,
    },
  })
}

export async function resetUserPassword({ id, password }: UserResetPasswordParams) {
  return prisma.user.update({
    where: { id },
    data: {
      passwordHash: password,
    },
  })
}
