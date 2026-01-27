import assert from 'node:assert/strict'
import { it } from 'vitest'
import { useLoginRules } from '../../src/composables/useLoginRules.ts'

it('useLoginRules provides login validation rules', () => {
  const t = key => key
  const { rules } = useLoginRules({ t })
  const resolved = rules.value

  assert.equal(resolved.username[0].required, true)
  assert.equal(resolved.username[0].message, 'login.usernameRequired')
  assert.equal(resolved.username[1].min, 3)
  assert.equal(resolved.username[1].max, 32)
  assert.equal(resolved.username[1].message, 'login.usernameLength')
  assert.equal(resolved.username[2].pattern?.toString(), /^[\w.-]+$/.toString())
  assert.equal(resolved.username[2].message, 'login.usernamePattern')

  assert.equal(resolved.password[0].required, true)
  assert.equal(resolved.password[0].message, 'login.passwordRequired')
  assert.equal(resolved.password[1].min, 6)
  assert.equal(resolved.password[1].max, 64)
  assert.equal(resolved.password[1].message, 'login.passwordLength')
})
