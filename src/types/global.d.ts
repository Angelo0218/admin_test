import 'vue'

declare global {
  const $message: any
  const $dialog: any
  const $loadingBar: any
  const $notification: any

  interface Window {
    $message?: any
    $dialog?: any
    $loadingBar?: any
    $notification?: any
  }
}

declare module 'vue' {
  export interface ComponentCustomProperties {
    $message: any
    $dialog: any
    $loadingBar: any
    $notification: any
  }
}
