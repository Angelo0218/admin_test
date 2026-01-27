import { useAuthStore } from '@/store'
import { resolveResError } from './helpers'

export function setupInterceptors(axiosInstance) {
  const SUCCESS_CODES = [0, 200]
  const pendingRequests = []
  let isRefreshing = false

  function resResolve(response) {
    const { data, status, config, statusText, headers } = response
    if (headers['content-type']?.includes('json')) {
      const isSuccess = data?.success === true || SUCCESS_CODES.includes(data?.code)
      if (isSuccess) {
        return Promise.resolve(data)
      }
      const code = data?.error?.code ?? data?.code ?? status
      const needTip = config?.needTip !== false
      const useServerMessage = config?.useServerMessage === true
        || import.meta.env.VITE_USE_SERVER_MESSAGE === 'true'
      const serverMessage = data?.error?.message ?? data?.message ?? statusText
      // ??? code ?????????
      const message = resolveResError(code, useServerMessage ? serverMessage : undefined, needTip)
      return Promise.reject({ code, message, error: data ?? response })
    }
    return Promise.resolve(data ?? response)
  }

  async function resReject(error) {
    const useServerMessage = error?.config?.useServerMessage === true
      || import.meta.env.VITE_USE_SERVER_MESSAGE === 'true'
    if (!error || !error.response) {
      const code = error?.code
      // ??? code ?????????
      const message = resolveResError(code, useServerMessage ? error?.message : undefined)
      return Promise.reject({ code, message, error })
    }

    const { data, status, config } = error.response
    const code = data?.error?.code ?? data?.code ?? status

    if (code === 401 && config && !config.skipAuthRefresh && !config._retry) {
      config._retry = true
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject, config })
        })
      }
      isRefreshing = true
      const authStore = useAuthStore()
      try {
        const refreshRes = await axiosInstance.post('/auth/refresh/token', {}, { needToken: false, skipAuthRefresh: true })
        const accessToken = refreshRes?.data?.accessToken
        if (!accessToken) {
          throw new Error('missing access token')
        }
        authStore.setToken({ accessToken })

        pendingRequests.splice(0).forEach(({ resolve, config }) => {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${accessToken}`
          resolve(axiosInstance(config))
        })

        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${accessToken}`
        return axiosInstance(config)
      }
      catch (refreshError) {
        pendingRequests.splice(0).forEach(({ reject }) => reject(refreshError))
        authStore.logout()
        return Promise.reject(refreshError)
      }
      finally {
        isRefreshing = false
      }
    }

    const needTip = config?.needTip !== false
    const serverMessage = data?.error?.message ?? data?.message ?? error.message
    const message = resolveResError(code, useServerMessage ? serverMessage : undefined, needTip)
    return Promise.reject({ code, message, error: error.response?.data || error.response })
  }

  axiosInstance.interceptors.request.use(reqResolve, reqReject)
  axiosInstance.interceptors.response.use(resResolve, resReject)
}

function reqResolve(config) {
  // needToken = false ????????token
  if (config.needToken === false) {
    return config
  }

  const { accessToken } = useAuthStore()
  if (accessToken) {
    // token: Bearer + xxx
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}

function reqReject(error) {
  return Promise.reject(error)
}
