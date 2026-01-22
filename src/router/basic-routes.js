export const basicRoutes = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登入',
      layout: 'empty',
    },
  },
  {
    name: 'Root',
    path: '/',
    redirect: '/kyc/pending',
  },
  {
    name: '403',
    path: '/403',
    component: () => import('@/views/error-page/403.vue'),
    meta: {
      title: '403',
      layout: 'empty',
    },
  },
  {
    name: '404',
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {
      title: '404',
      layout: 'empty',
    },
  },
]
