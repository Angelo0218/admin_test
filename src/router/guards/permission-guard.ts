import { useAuthStore, usePermissionStore, useUserStore } from '@/store'
import { getUserInfo } from '@/store/helper'

const WHITE_LIST = ['/login', '/403', '/404']
const DEFAULT_ROUTE = {
  ADMIN: '/kyc/pending',
  AUDITOR: '/kyc/pending',
  SUPPORT: '/tickets',
}

function getRoleCode(userStore) {
  return userStore?.currentRole?.code || userStore?.roles?.[0]?.code || ''
}

function getDefaultPath(role) {
  return DEFAULT_ROUTE[role] || '/login'
}

function hasAccess(route, role) {
  // 白名單與未設定 meta.roles 的路由一律放行
  if (WHITE_LIST.includes(route.path))
    return true
  const allowRoles = route.meta?.roles
  if (!allowRoles || !allowRoles.length)
    return true
  return allowRoles.includes(role)
}

export function createPermissionGuard(router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    if (!token) {
      if (WHITE_LIST.includes(to.path))
        return true
      return { path: '/login', query: { ...to.query, redirect: to.fullPath } }
    }

    if (to.path === '/login')
      return { path: '/' }
    if (WHITE_LIST.includes(to.path))
      return true

    const userStore = useUserStore()
    const permissionStore = usePermissionStore()

    if (!userStore.userInfo) {
      try {
        // 僅向 /user/detail 取一次使用者資訊與角色
        const user = await getUserInfo()
        userStore.setUser(user)
      }
      catch (error) {
        console.error(error)
        authStore.resetLoginState()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    const roleCode = getRoleCode(userStore)
    permissionStore.setRolePermissions(roleCode)

    if (to.path === '/')
      return { path: getDefaultPath(roleCode), replace: true }
    if (!hasAccess(to, roleCode))
      return { name: '403', query: { path: to.fullPath }, state: { from: 'permission-guard' } }
    return true
  })
}
