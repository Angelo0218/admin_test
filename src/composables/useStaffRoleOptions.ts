import { computed } from 'vue'

export function useStaffRoleOptions({ t }: { t: (key: string) => string }) {
  const roleOptions = computed(() => ([
    { label: t('roles.SUPPORT'), value: 'SUPPORT' },
    { label: t('roles.AUDITOR'), value: 'AUDITOR' },
  ]))

  return { roleOptions }
}
