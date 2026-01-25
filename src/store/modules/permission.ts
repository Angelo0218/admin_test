import { defineStore } from 'pinia'
import { i18n } from '@/locales'
import { basicRoutes } from '@/router/basic-routes'
import { isExternal } from '@/utils'

function createRouteItem(route) {
  const meta = route.meta || {}
  const originPath = isExternal(route.path) ? route.path : undefined
  return {
    code: route.name,
    name: route.name,
    titleKey: meta.titleKey,
    icon: meta.icon,
    order: meta.order ?? 0,
    show: meta.show !== false,
    path: route.path,
    redirect: route.redirect,
    roles: meta.roles,
    keepAlive: !!meta.keepAlive,
    parentKey: meta.parentKey,
    originPath,
    group: meta.group,
  }
}

function ensureGroupFromMeta(item, groupMap) {
  const group = item.group
  if (!group?.code)
    return null
  if (groupMap.has(group.code))
    return groupMap.get(group.code)
  const entry = {
    code: group.code,
    name: group.name || group.code,
    titleKey: group.titleKey,
    icon: group.icon,
    order: group.order ?? 0,
    show: group.show !== false,
    roles: group.roles,
    path: group.path,
    originPath: group.originPath,
    children: [],
  }
  groupMap.set(group.code, entry)
  return entry
}

function sortTree(items) {
  return items
    .map(item => ({
      ...item,
      children: item.children?.length ? sortTree(item.children) : undefined,
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function buildPermissionTree() {
  const routeItems = basicRoutes
    .filter(route => route.meta?.layout && route.meta.layout !== 'empty')
    .map(createRouteItem)

  const itemMap = new Map(routeItems.map(item => [item.code, { ...item, children: [] }]))
  const groupMap = new Map()
  const roots = []

  for (const item of itemMap.values()) {
    if (item.parentKey) {
      const parent = itemMap.get(item.parentKey)
        || groupMap.get(item.parentKey)
        || ensureGroupFromMeta(item, groupMap)
      if (parent) {
        parent.children.push(item)
        continue
      }
    }
    roots.push(item)
  }

  const groups = Array.from(groupMap.values()).filter(group => group.children?.length)
  return sortTree([...roots, ...groups])
}

function filterTreeByRole(tree, role) {
  return tree
    .filter(item => !item.roles || item.roles.includes(role))
    .map(item => ({
      ...item,
      children: item.children ? filterTreeByRole(item.children, role) : undefined,
    }))
    .filter(item => item.path || (item.children && item.children.length > 0))
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    accessRoutes: [],
    permissions: [],
    menus: [],
  }),
  actions: {
    // 靘??脤?瞈曉?蝡舀??邦銝阡?撱粹??
    setRolePermissions(role) {
      this.accessRoutes = []
      this.permissions = filterTreeByRole(buildPermissionTree(), role)
      this.rebuildMenus()
    },
    rebuildMenus() {
      this.menus = this.permissions
        .map(item => this.getMenuItem(item))
        .filter(item => !!item)
        .sort((a, b) => a.order - b.order)
    },
    resolveMenuLabel(item) {
      const key = item.titleKey || `menu.${item.code}`
      const label = i18n.global.t(key)
      return label === key ? item.name : label
    },
    getMenuItem(item) {
      const menuItem = {
        label: this.resolveMenuLabel(item),
        key: item.code,
        path: item.path,
        originPath: item.originPath,
        order: item.order ?? 0,
      }
      if (item.icon) {
        menuItem.icon = () => h('i', { class: `${item.icon} text-16` })
      }
      const children = item.children || []
      if (children.length) {
        menuItem.children = children
          .map(child => this.getMenuItem(child))
          .filter(item => !!item)
          .sort((a, b) => a.order - b.order)
        if (!menuItem.children.length)
          delete menuItem.children
      }
      if (!item.show)
        return null
      return menuItem
    },
    resetPermission() {
      this.$reset()
    },
  },
})
