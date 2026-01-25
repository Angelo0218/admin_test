<template>
  <NAutoComplete
    :value="value"
    :options="filteredOptions"
    :placeholder="placeholder"
    :clearable="clearable"
    @update:value="handleUpdate"
  />
</template>

<script setup>
import { NAutoComplete } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  rows: {
    type: Array,
    default: () => [],
  },
  fields: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '',
  },
  maxOptions: {
    type: Number,
    default: 20,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:value'])

function normalize(value) {
  if (!value)
    return ''
  return String(value).trim().toLowerCase()
}

function toStringValue(value) {
  if (value === null || value === undefined)
    return ''
  return String(value).trim()
}

const fieldGetters = computed(() => props.fields.map(field =>
  (typeof field === 'function' ? field : row => row?.[field]),
))

const baseOptions = computed(() => {
  const values = new Set()
  const items = Array.isArray(props.rows) ? props.rows : []
  items.forEach((row) => {
    fieldGetters.value.forEach((getter) => {
      const raw = getter(row)
      if (Array.isArray(raw)) {
        raw.forEach((entry) => {
          const value = toStringValue(entry)
          if (value)
            values.add(value)
        })
        return
      }
      const value = toStringValue(raw)
      if (value)
        values.add(value)
    })
  })
  return Array.from(values).map(value => ({ label: value, value }))
})

const filteredOptions = computed(() => {
  const needle = normalize(props.value)
  const options = baseOptions.value
  const filtered = needle
    ? options.filter(option => normalize(option.value).includes(needle))
    : options
  return filtered.slice(0, props.maxOptions)
})

function handleUpdate(nextValue) {
  emit('update:value', nextValue ?? '')
}
</script>
