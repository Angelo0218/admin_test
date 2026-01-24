import { describe, expect, it } from 'bun:test'
import { ROLE_CODES } from '../src/constants/roles'
import { buildUserWhere } from '../src/models/user'

describe('buildUserWhere', () => {
  it('excludes staff roles by default', () => {
    const where = buildUserWhere()

    expect(where).toMatchObject({
      status: { not: 'DELETED' },
      roles: {
        none: {
          role: {
            code: {
              in: [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR],
            },
          },
        },
      },
    })
  })

  it('includes staff roles when staffOnly is true', () => {
    const where = buildUserWhere({ staffOnly: true })

    expect(where).toMatchObject({
      status: { not: 'DELETED' },
      roles: {
        some: {
          role: {
            code: {
              in: [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR],
            },
          },
        },
      },
    })
  })
})
