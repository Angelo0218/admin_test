import { describe, expect, it } from 'bun:test'
import { ROLE_CODES } from '../src/constants/roles'
import { buildUserWhere } from '../src/models/user'

describe('buildUserWhere', () => {
  it('defaults to staff-only and excludes deleted', () => {
    const where = buildUserWhere()

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

  it('can exclude staff when staffOnly is false', () => {
    const where = buildUserWhere({ staffOnly: false })

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
})
