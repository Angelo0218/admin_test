import { describe, expect, it } from 'bun:test'
import { buildDemoSeedPlan } from '../src/models/seed'

describe('buildDemoSeedPlan', () => {
  it('creates deterministic demo payload', () => {
    const plan = buildDemoSeedPlan({
      adminId: 'admin-1',
      applicants: [
        { id: 'u1' },
        { id: 'u2' },
        { id: 'u3' },
        { id: 'u4' },
        { id: 'u5' },
        { id: 'u6' },
      ],
    })

    expect(plan.kycApplications).toHaveLength(6)
    expect(plan.kycAppeals).toHaveLength(2)
    expect(plan.tickets).toHaveLength(6)
    expect(plan.auditLogs).toHaveLength(3)

    expect(plan.kycApplications.every(item => item.id.startsWith('KYC_2'))).toBe(true)
    expect(plan.tickets.every(item => item.subject.startsWith('DEMO-'))).toBe(true)
    expect(plan.kycApplications[1].review?.reviewerId).toBe('admin-1')
  })
})
