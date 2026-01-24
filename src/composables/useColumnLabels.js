import { computed, unref } from 'vue'

export function useColumnLabels(baseColumns, keys = []) {
  const columnLabelMap = computed(() => {
    const columns = unref(baseColumns) || []
    return Object.fromEntries(columns.map(column => [column.key, column.title]))
  })

  const fieldLabels = computed(() => {
    return Object.fromEntries(keys.map(key => [key, columnLabelMap.value[key]]))
  })

  return { columnLabelMap, fieldLabels }
}
