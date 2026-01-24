import { computed, unref } from 'vue'

export function useAutoCompleteOptions(source, getters = [], {
  minQueryLength = 0,
  query = null,
} = {}) {
  return computed(() => {
    const items = unref(source) || []
    const input = query ? unref(query) : ''
    const normalizedInput = typeof input === 'string' ? input.trim().toLowerCase() : ''
    if (minQueryLength > 0 && normalizedInput.length < minQueryLength) {
      return []
    }
    const values = new Set()
    items.forEach((item) => {
      getters.forEach((getter) => {
        const value = getter(item)
        if (value) {
          values.add(String(value))
        }
      })
    })
    const all = Array.from(values)
    const filtered = normalizedInput
      ? all.filter(value => value.toLowerCase().includes(normalizedInput))
      : all
    return filtered
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(value => ({ label: value, value }))
  })
}
