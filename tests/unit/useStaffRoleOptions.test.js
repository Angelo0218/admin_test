import assert from 'node:assert/strict'
import { it } from 'vitest'
import { useStaffRoleOptions } from '../../src/composables/useStaffRoleOptions.ts'

it('useStaffRoleOptions returns support + auditor only', () => {
  const { roleOptions } = useStaffRoleOptions({
    t: key => key,
  })

  assert.deepEqual(
    roleOptions.value.map(option => option.value),
    ['SUPPORT', 'AUDITOR'],
  )
})
