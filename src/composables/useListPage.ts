import { useListFilters } from '@/composables/useListFilters'
import { useListPagination } from '@/composables/useListPagination'

interface ListPageOptions {
  filters?: Record<string, unknown>
  fetchList: () => void | Promise<void>
  page?: number
  pageSize?: number
  itemCount?: number
  watchFilters?: boolean
  debounce?: number
}

export function useListPage({
  filters,
  fetchList,
  page,
  pageSize,
  itemCount,
  watchFilters = true,
  debounce,
}: ListPageOptions) {
  const pagination = useListPagination({ page, pageSize, itemCount, fetchList })

  if (filters && watchFilters) {
    useListFilters({ filters, pagination, fetchList, debounce })
  }

  return { pagination }
}
