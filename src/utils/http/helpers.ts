import { i18n } from '@/locales'
import { useAuthStore } from '@/store'

let isConfirming = false

function t(key, params) {
  return i18n.global.t(key, params)
}

function handleAuthExpired(content, needTip) {
  if (isConfirming || !needTip)
    return false
  isConfirming = true
  if (!window.$dialog?.confirm) {
    useAuthStore().logout()
    window.$message?.error(content)
    isConfirming = false
    return false
  }
  window.$dialog.confirm({
    title: t('errors.sessionExpiredTitle'),
    type: 'info',
    content,
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    confirm() {
      useAuthStore().logout()
      window.$message?.success(t('common.logoutSuccess'))
      isConfirming = false
    },
    cancel() {
      isConfirming = false
    },
  })
  return false
}

export function resolveResError(code, message, needTip = true) {
  const hasMessage = typeof message === 'string' && message.trim()
  switch (code) {
    case 401: {
      if (hasMessage) {
        const normalized = message === 'invalid credentials'
          ? t('login.invalidCredentials')
          : message === 'missing refresh token'
            ? t('errors.sessionExpiredContent')
            : message
        if (needTip)
          window.$message?.error(normalized)
        return normalized
      }
      const content = t('errors.sessionExpiredContent')
      handleAuthExpired(content, needTip)
      return content
    }
    case 11007:
    case 11008: {
      const content = t('errors.sessionExpiredWithMessage', {
        message: hasMessage ? message : t('errors.sessionExpiredContent'),
      })
      handleAuthExpired(content, needTip)
      return content
    }
    case 403:
      message = hasMessage ? message : t('errors.forbidden')
      break
    case 404:
      message = hasMessage ? message : t('errors.notFound')
      break
    case 429:
      message = hasMessage ? message : t('errors.tooManyRequests')
      break
    case 500:
      message = hasMessage ? message : t('errors.serverError')
      break
    default:
      message = hasMessage ? message : t('errors.unknown', { code })
      break
  }
  if (needTip)
    window.$message?.error(message)
  return message
}
