import { prisma } from '../db/client'

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

export function mapUserResponse(user: NonNullable<Awaited<ReturnType<typeof findUserById>>>, currentRoleCode?: string) {
  const roles = user.roles.map(item => ({
    id: item.role.id,
    code: item.role.code,
    name: item.role.name,
  }))

  const currentRole = currentRoleCode
    ? roles.find(role => role.code === currentRoleCode) || roles[0]
    : roles[0]

  return {
    id: user.id,
    username: user.username,
    profile: {
      avatar: user.avatar || '',
      nickName: user.displayName,
    },
    roles,
    currentRole,
  }
}
