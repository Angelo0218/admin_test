interface PermissionNode {
  code: string
  name: string
  type: string
  icon?: string
  order?: number
  enable?: boolean
  show?: boolean
  path?: string
  redirect?: string
  component?: string
  layout?: string
  keepAlive?: boolean
  roles?: string[]
  children?: PermissionNode[]
}

export const permissionTree: PermissionNode[] = [
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
    roles: ['ADMIN', 'AUDITOR'],
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
        roles: ['ADMIN', 'AUDITOR'],
      },
      {
        code: 'KycAppeals',
        name: '申訴列表',
        type: 'MENU',
        path: '/kyc/appeals',
        component: '/src/views/kyc/appeals/index.vue',
        layout: 'normal',
        keepAlive: true,
        enable: true,
        show: true,
        order: 2,
        roles: ['ADMIN', 'AUDITOR'],
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
        order: 3,
        roles: ['ADMIN', 'AUDITOR'],
      },
    ],
  },
  {
    code: 'Tickets',
    name: '客服工單',
    type: 'MENU',
    icon: 'i-fe:message-square',
    order: 2,
    enable: true,
    show: true,
    path: '/tickets',
    redirect: '/tickets',
    roles: ['ADMIN', 'SUPPORT'],
    children: [
      {
        code: 'TicketList',
        name: '工單列表',
        type: 'MENU',
        path: '/tickets',
        component: '/src/views/tickets/index.vue',
        layout: 'normal',
        keepAlive: true,
        enable: true,
        show: true,
        order: 1,
        roles: ['ADMIN', 'SUPPORT'],
      },
      {
        code: 'TicketDetail',
        name: '工單詳情',
        type: 'MENU',
        path: '/tickets/:id',
        component: '/src/views/tickets/detail/index.vue',
        layout: 'normal',
        keepAlive: false,
        enable: true,
        show: false,
        order: 2,
        roles: ['ADMIN', 'SUPPORT'],
      },
    ],
  },
  {
    code: 'Users',
    name: '用戶管理',
    type: 'MENU',
    icon: 'i-fe:user',
    order: 3,
    enable: true,
    show: true,
    path: '/users',
    component: '/src/views/users/index.vue',
    layout: 'normal',
    keepAlive: true,
    roles: ['ADMIN'],
  },
  {
    code: 'Roles',
    name: '角色權限',
    type: 'MENU',
    icon: 'i-fe:users',
    order: 4,
    enable: true,
    show: true,
    path: '/roles',
    component: '/src/views/roles/index.vue',
    layout: 'normal',
    keepAlive: true,
    roles: ['ADMIN'],
  },
  {
    code: 'Audit',
    name: '審計記錄',
    type: 'MENU',
    icon: 'i-fe:file-text',
    order: 5,
    enable: true,
    show: true,
    path: '/audit',
    component: '/src/views/audit/index.vue',
    layout: 'normal',
    keepAlive: true,
    roles: ['ADMIN'],
  },
]

function filterTree(tree: PermissionNode[], role: string): PermissionNode[] {
  return tree
    .filter(node => !node.roles || node.roles.includes(role))
    .map(node => ({
      ...node,
      children: node.children ? filterTree(node.children, role) : undefined,
    }))
    .filter(node => node.path || (node.children && node.children.length > 0))
}

function flattenPaths(tree: PermissionNode[]) {
  const stack = [...tree]
  const paths: string[] = []
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

const cachedPaths = new Map<string, string[]>()

export function getPermissionTree(role: string) {
  return filterTree(permissionTree, role)
}

export function isPathAllowed(path: string, role: string) {
  if (!path || !role) {
    return false
  }
  if (!cachedPaths.has(role)) {
    const tree = getPermissionTree(role)
    cachedPaths.set(role, flattenPaths(tree))
  }
  const paths = cachedPaths.get(role) || []
  return paths.some((item) => {
    if (item.includes(':')) {
      const base = item.split('/:')[0]
      return path.startsWith(base)
    }
    return item === path
  })
}
