import assert from 'node:assert/strict'
import test from 'vitest'
import { ref } from 'vue'
import { useColumnLabels } from '../../src/composables/useColumnLabels.js'

test('useColumnLabels builds label maps', () => {
  const baseColumns = ref([
    { key: 'name', title: 'Name' },
    { key: 'status', title: 'Status' },
  ])

  const { columnLabelMap, fieldLabels } = useColumnLabels(baseColumns, ['name'])

  assert.equal(columnLabelMap.value.name, 'Name')
  assert.equal(columnLabelMap.value.status, 'Status')
  assert.equal(fieldLabels.value.name, 'Name')
  assert.equal(fieldLabels.value.status, undefined)
})
