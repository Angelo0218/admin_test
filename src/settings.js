/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/13 20:54:36
 * @Email: zclzone@outlook.com
 * Copyright 穢 2023 Ronnie Zhang(憭扯?? | https://isme.top
 **********************************/

export const defaultLayout = 'normal'

export const defaultPrimaryColor = '#316C72'

// 控制 LayoutSetting 顯示
export const layoutSettingVisible = false

export const naiveThemeOverrides = {
  common: {
    primaryColor: '#316C72FF',
    primaryColorHover: '#316C72E3',
    primaryColorPressed: '#2B4C59FF',
    primaryColorSuppl: '#316C72E3',
  },
}

export const basePermissions = [
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
        icon: 'i-fe:list',
        order: 1,
        enable: true,
        show: true,
        layout: 'normal',
        keepAlive: true,
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
        icon: 'i-fe:search',
        order: 2,
        enable: true,
        show: false,
        layout: 'normal',
        keepAlive: false,
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
        icon: 'i-fe:archive',
        order: 3,
        enable: true,
        show: true,
        layout: 'normal',
        keepAlive: true,
      },
    ],
  },
]
