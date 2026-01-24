import { ref, watch } from 'vue'

export function useListKeywordFilter(getFilter, setFilter, key = 'keyword') {
  const keywordInput = ref(getFilter(key) || '')

  function applyKeyword(value = keywordInput.value) {
    const next = typeof value === 'string' ? value.trim() : ''
    setFilter(key, next)
    keywordInput.value = next
  }

  function handleKeywordSelect(value) {
    applyKeyword(value)
  }

  watch(keywordInput, (value) => {
    if (!value) {
      setFilter(key, '')
    }
  })

  return {
    keywordInput,
    applyKeyword,
    handleKeywordSelect,
  }
}
