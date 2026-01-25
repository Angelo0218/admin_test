<template>
  <ListFilters>
    <template v-for="field in fields" :key="field.key">
      <n-select
        v-if="field.type === 'select'"
        :value="filters[field.key]"
        :options="selectOptions[field.key]"
        :placeholder="field.placeholder"
        :class="field.class || 'w-full sm:w-180'"
        filterable
        clearable
        @update:value="value => setFilter(field.key, value)"
      />
      <KeywordAutoComplete
        v-else-if="field.type === 'keyword'"
        :value="filters[field.key] || ''"
        :rows="rowsValue"
        :fields="resolveKeywordFields(field)"
        :placeholder="field.placeholder"
        :class="field.class || 'w-full sm:w-220'"
        @update:value="value => setFilter(field.key, value)"
      />
      <NDatePicker
        v-else-if="field.type === 'daterange'"
        :value="filters[field.key]"
        :type="field.pickerType || 'datetimerange'"
        :placeholder="field.placeholder"
        :class="field.class || 'w-full sm:w-260'"
        clearable
        @update:value="value => setFilter(field.key, value)"
      />
    </template>
  </ListFilters>
</template>

<script setup>
import { NDatePicker } from 'naive-ui'
import { computed } from 'vue'
import { KeywordAutoComplete, ListFilters } from '@/components'

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
const rowsValue = computed(() => (Array.isArray(props.rows) ? props.rows : props.rows?.value || []))

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

function resolveKeywordFields(field) {
  if (Array.isArray(field.getters) && field.getters.length) {
    return field.getters.map(getter => (row) => {
      try {
        return getter(row)
      }
      catch {
        return undefined
      }
    })
  }
  if (Array.isArray(field.keys) && field.keys.length) {
    return field.keys
  }
  return [field.key]
}

const selectOptions = computed(() => {
  const result = {}
  props.fields.forEach((field) => {
    const getters = resolveGetters(field)
    if (field.type === 'select') {
      if (Array.isArray(field.options)) {
        result[field.key] = field.options
      }
      else {
        result[field.key] = buildOptions(props.rows, getters, '', 0, field.labelFormatter)
      }
    }
  })
  return result
})
</script>
