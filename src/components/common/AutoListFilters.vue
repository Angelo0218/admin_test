<template>
  <ListFilters>
    <template v-for="field in fields" :key="field.key">
      <n-select
        v-if="field.type === 'select'"
        :value="filters[field.key]"
        :options="optionsMap[field.key]"
        :placeholder="field.placeholder"
        :class="field.class || 'w-full sm:w-180'"
        filterable
        clearable
        @update:value="value => setFilter(field.key, value)"
      />
      <n-auto-complete
        v-else-if="field.type === 'keyword'"
        v-model:value="keywordInput"
        :options="optionsMap[field.key]"
        :placeholder="field.placeholder"
        :class="field.class || 'w-full sm:w-220'"
        clearable
        @select="handleKeywordSelect"
        @keyup.enter="applyKeyword()"
      />
    </template>
  </ListFilters>
</template>

<script setup>
import { computed, unref } from 'vue'
import { ListFilters } from '@/components'
import { useListKeywordFilter } from '@/composables'

const props = defineProps({
  rows: {
    type: [Array, Object],
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
  fields: {
    type: Array,
    required: true,
  },
})
const emit = defineEmits(['update:filters'])

function resolveGetters(field) {
  if (Array.isArray(field.getters) && field.getters.length) {
    return field.getters
  }
  if (Array.isArray(field.keys) && field.keys.length) {
    return field.keys.map(key => row => row?.[key])
  }
  return [row => row?.[field.key]]
}

const filters = computed(() => props.filters)
const keywordField = computed(() => props.fields.find(item => item.type === 'keyword'))
const keywordKey = computed(() => keywordField.value?.key || 'keyword')
const { keywordInput, applyKeyword, handleKeywordSelect } = useListKeywordFilter(
  key => props.filters?.[key],
  (key, value) => {
    emit('update:filters', {
      ...props.filters,
      [key]: value,
    })
  },
  unref(keywordKey),
)

function setFilter(key, value) {
  emit('update:filters', {
    ...props.filters,
    [key]: value,
  })
}

function normalize(value) {
  if (value === null || value === undefined)
    return ''
  return String(value).trim().toLowerCase()
}

function buildOptions(rows, getters, query, minQueryLength = 0, labelFormatter) {
  const items = Array.isArray(rows) ? rows : rows?.value || []
  const needle = normalize(query)
  if (minQueryLength > 0 && needle.length < minQueryLength) {
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
  const filtered = needle
    ? all.filter(value => value.toLowerCase().includes(needle))
    : all
  const labeled = filtered.map((value) => {
    const label = labelFormatter ? labelFormatter(value) : value
    return { label, value }
  })
  return labeled.sort((a, b) => String(a.label).localeCompare(String(b.label)))
}

const optionsMap = computed(() => {
  const result = {}
  props.fields.forEach((field) => {
    const getters = resolveGetters(field)
    if (field.type === 'keyword') {
      const minQueryLength = field.minQueryLength ?? 1
      result[field.key] = buildOptions(props.rows, getters, keywordInput.value, minQueryLength)
    }
    else if (field.type === 'select') {
      result[field.key] = buildOptions(props.rows, getters, '', 0, field.labelFormatter)
    }
  })
  return result
})
</script>
