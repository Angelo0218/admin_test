import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    needToken?: boolean
    needTip?: boolean
  }
}
