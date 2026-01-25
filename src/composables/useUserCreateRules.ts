import { computed } from 'vue'

export function useUserCreateRules({ t }: { t: (key: string) => string }) {
  const rules = computed(() => ({
    username: [
      { required: true, message: t('users.create.usernameRequired'), trigger: ['input', 'blur'] },
      { min: 3, message: t('users.create.usernameMin'), trigger: ['input', 'blur'] },
    ],
    password: [
      { required: true, message: t('users.create.passwordRequired'), trigger: ['input', 'blur'] },
      { min: 6, message: t('users.create.passwordMin'), trigger: ['input', 'blur'] },
    ],
    displayName: [
      { required: true, message: t('users.create.displayNameRequired'), trigger: ['input', 'blur'] },
    ],
    roleCode: [
      { required: true, message: t('users.create.roleRequired'), trigger: ['change', 'blur'] },
    ],
  }))

  return { rules }
}
