export const permissionTree = [
  {
    code: 'Kyc',
    name: 'KYC 審核',
    type: 'MENU',
    icon: 'i-fe:shield',
    order: 1,
    enable: true,
    show: true,
    path: '/kyc',
    redirect: '/kyc/pending',
    children: [
      {
        code: 'KycPending',
        name: '待審核列表',
        type: 'MENU',
        path: '/kyc/pending',
        component: '/src/views/kyc/pending/index.vue',
        layout: 'normal',
        keepAlive: true,
        enable: true,
        show: true,
        order: 1,
        children: [
          { code: 'KycAssign', name: '分配案件', type: 'BUTTON', enable: true, show: false },
        ],
      },
      {
        code: 'KycDetail',
        name: '審核詳情',
        type: 'MENU',
        path: '/kyc/detail/:id',
        component: '/src/views/kyc/detail/index.vue',
        layout: 'normal',
        keepAlive: false,
        enable: true,
        show: false,
        order: 2,
        children: [
          { code: 'KycApprove', name: '通過', type: 'BUTTON', enable: true, show: false },
          { code: 'KycReject', name: '拒絕', type: 'BUTTON', enable: true, show: false },
          { code: 'KycReset', name: '重置狀態', type: 'BUTTON', enable: true, show: false },
        ],
      },
      {
        code: 'KycHistory',
        name: '歷史記錄與歸檔',
        type: 'MENU',
        path: '/kyc/history',
        component: '/src/views/kyc/history/index.vue',
        layout: 'normal',
        keepAlive: true,
        enable: true,
        show: true,
        order: 3,
      },
    ],
  },
]

function flattenPaths(tree) {
  const stack = [...tree]
  const paths = []
  while (stack.length) {
    const node = stack.pop()
    if (node?.path) {
      paths.push(node.path)
    }
    if (node?.children) {
      stack.push(...node.children)
    }
  }
  return paths
}

const cachedPaths = flattenPaths(permissionTree)

export function isPathAllowed(path) {
  if (!path)
    return false
  return cachedPaths.some((item) => {
    if (item.includes(':')) {
      const base = item.split('/:')[0]
      return path.startsWith(base)
    }
    return item === path
  })
}
