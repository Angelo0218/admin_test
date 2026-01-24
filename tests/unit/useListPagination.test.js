import assert from 'node:assert/strict'
import test from 'vitest'
import { useListPagination } from '../../src/composables/useListPagination.ts'

test('useListPagination updates page and triggers fetch', () => {
  let calls = 0
  const fetchList = () => {
    calls += 1
  }

  const pagination = useListPagination({ fetchList })

  assert.equal(pagination.page, 1)
  assert.equal(pagination.pageSize, 20)
  assert.equal(pagination.itemCount, 0)

  pagination.onChange(3)
  assert.equal(pagination.page, 3)
  assert.equal(calls, 1)

  pagination.onUpdatePageSize(50)
  assert.equal(pagination.pageSize, 50)
  assert.equal(pagination.page, 1)
  assert.equal(calls, 2)
})
