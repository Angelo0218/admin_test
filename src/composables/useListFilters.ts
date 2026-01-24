import { watchDebounced } from '@vueuse/core'

export function useListFilters({ filters, pagination, fetchList, debounce = 300 }) {
  return watchDebounced(
    filters,
    () => {
      pagination.page = 1
      fetchList()
    },
    { deep: true, debounce },
  )
}
