import { defineStore } from 'pinia'
import { i18n } from '@/locales'
import { frontendPermissionTree } from '@/router/permission-tree'
import { isExternal } from '@/utils'

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
    // 依角色過濾前端權限樹並重建選單
    setRolePermissions(role) {
      this.accessRoutes = []
      this.permissions = filterTreeByRole(frontendPermissionTree, role)
      this.rebuildMenus()
    },
    rebuildMenus() {
      this.menus = this.permissions
        .filter(item => item.type === 'MENU')
        .map(item => this.getMenuItem(item))
        .filter(item => !!item)
        .sort((a, b) => a.order - b.order)
    },
    resolveMenuLabel(item) {
      const key = `menu.${item.code}`
      const label = i18n.global.t(key)
      return label === key ? item.name : label
    },
    getMenuItem(item, parent) {
      const route = this.generateRoute(item, item.show ? null : parent?.key)
      const menuItem = {
        label: this.resolveMenuLabel(item),
        key: route.name,
        path: route.path,
        originPath: route.meta.originPath,
        icon: () => h('i', { class: `${route.meta.icon} text-16` }),
        order: item.order ?? 0,
      }
      const children = item.children?.filter(child => child.type === 'MENU') || []
      if (children.length) {
        menuItem.children = children
          .map(child => this.getMenuItem(child, menuItem))
          .filter(item => !!item)
          .sort((a, b) => a.order - b.order)
        if (!menuItem.children.length)
          delete menuItem.children
      }
      if (!item.show)
        return null
      return menuItem
    },
    generateRoute(item, parentKey) {
      let originPath
      if (isExternal(item.path)) {
        originPath = item.path
      }
      const titleKey = `menu.${item.code}`
      return {
        name: item.code,
        path: item.path,
        redirect: item.redirect,
        component: item.component,
        meta: {
          originPath,
          icon: `${item.icon}?mask`,
          title: item.name,
          titleKey,
          layout: item.layout,
          keepAlive: !!item.keepAlive,
          parentKey,
          btns: item.children
            ?.filter(child => child.type === 'BUTTON')
            .map(child => ({ code: child.code, name: child.name })),
        },
      }
    },
    resetPermission() {
      this.$reset()
    },
  },
})
