import { reactive } from 'vue'

export function useListPagination({
  page = 1,
  pageSize = 20,
  itemCount = 0,
  fetchList,
} = {}) {
  if (typeof fetchList !== 'function') {
    throw new TypeError('useListPagination requires fetchList')
  }

  const pagination = reactive({
    page,
    pageSize,
    itemCount,
    onChange: (nextPage) => {
      pagination.page = nextPage
      fetchList()
    },
    onUpdatePageSize: (nextPageSize) => {
      pagination.pageSize = nextPageSize
      pagination.page = 1
      fetchList()
    },
  })

  return pagination
}
