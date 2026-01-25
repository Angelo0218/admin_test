import assert from 'node:assert/strict'
import { it } from 'vitest'
import { useUserCreateRules } from '../../src/composables/useUserCreateRules.ts'

it('useUserCreateRules provides required and min rules', () => {
  const t = key => key
  const { rules } = useUserCreateRules({ t })
  const resolved = rules.value

  assert.equal(resolved.username[0].required, true)
  assert.equal(resolved.username[0].message, 'users.create.usernameRequired')
  assert.equal(resolved.username[1].min, 3)
  assert.equal(resolved.username[1].message, 'users.create.usernameMin')

  assert.equal(resolved.password[0].required, true)
  assert.equal(resolved.password[0].message, 'users.create.passwordRequired')
  assert.equal(resolved.password[1].min, 6)
  assert.equal(resolved.password[1].message, 'users.create.passwordMin')

  assert.equal(resolved.displayName[0].required, true)
  assert.equal(resolved.displayName[0].message, 'users.create.displayNameRequired')

  assert.equal(resolved.roleCode[0].required, true)
  assert.equal(resolved.roleCode[0].message, 'users.create.roleRequired')
})
