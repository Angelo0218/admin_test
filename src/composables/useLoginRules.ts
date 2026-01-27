import { computed } from 'vue'

const USERNAME_PATTERN = /^[\w.-]+$/

export function useLoginRules({ t }: { t: (key: string) => string }) {
  const rules = computed(() => ({
    username: [
      { required: true, message: t('login.usernameRequired'), trigger: ['input', 'blur'] },
      { min: 3, max: 32, message: t('login.usernameLength'), trigger: ['input', 'blur'] },
      { pattern: USERNAME_PATTERN, message: t('login.usernamePattern'), trigger: ['input', 'blur'] },
    ],
    password: [
      { required: true, message: t('login.passwordRequired'), trigger: ['input', 'blur'] },
      { min: 6, max: 64, message: t('login.passwordLength'), trigger: ['input', 'blur'] },
    ],
  }))

  return { rules }
}
