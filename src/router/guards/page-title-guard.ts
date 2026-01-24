import { i18n } from '@/locales'

const baseTitle = import.meta.env.VITE_TITLE

export function createPageTitleGuard(router) {
  router.afterEach((to) => {
    const titleKey = to.meta?.titleKey
    const rawTitle = to.meta?.title
    let pageTitle = rawTitle
    if (titleKey) {
      const localized = i18n.global.t(titleKey)
      pageTitle = localized === titleKey ? rawTitle : localized
    }
    document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle
  })
}
