import { useTabStore } from '@/store'

export const EXCLUDE_TAB = ['/404', '/403', '/login']

export function createTabGuard(router) {
  router.afterEach((to) => {
    if (EXCLUDE_TAB.includes(to.path))
      return
    const hasParamRoute = to.matched.some(route => route.path.includes('/:'))
    // 詳情頁不加入 AppTab，避免標籤列過長
    if (hasParamRoute)
      return
    const tabStore = useTabStore()
    const { name, fullPath: path } = to
    const title = to.meta?.title
    const titleKey = to.meta?.titleKey
    const icon = to.meta?.icon
    const keepAlive = to.meta?.keepAlive
    tabStore.addTab({ name, path, title, titleKey, icon, keepAlive })
  })
}
