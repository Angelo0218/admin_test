import { env } from '../config/env'
import { prisma } from '../db/client'
import {
  seedAuditLogsData,
  seedKycAppealsData,
  seedKycApplicationsData,
  seedRoleMap,
  seedTicketMessagesData,
  seedTicketsData,
  seedUserMap,
} from '../seed/builders'

export async function seedDefaults() {
  if (!env.enableSeed) {
    return { skipped: true }
  }
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return { skipped: true }
  }

  const roleMap = await seedRoleMap()
  const userMap = await seedUserMap(roleMap)
  const applications = await seedKycApplicationsData(userMap)
  await seedKycAppealsData(applications, userMap)
  const tickets = await seedTicketsData(userMap)
  await seedTicketMessagesData(tickets, userMap)
  await seedAuditLogsData(applications, tickets, userMap)

  return { skipped: false }
}

interface DemoSeedPlanInput {
  adminId: string
  applicants: Array<{ id: string }>
}

export function buildDemoSeedPlan({ adminId, applicants }: DemoSeedPlanInput) {
  const kycApplications = applicants.map((applicant, index) => ({
    id: `KYC_2${index + 1}`,
    userId: applicant.id,
    status: 'PENDING',
    review: index === 1 ? { reviewerId: adminId, action: 'PASSED' } : undefined,
  }))

  const kycAppeals = kycApplications.slice(0, 2).map(application => ({
    applicationId: application.id,
    status: 'PENDING',
    reason: 'DEMO-APPEAL',
  }))

  const tickets = applicants.map((applicant, index) => ({
    requesterId: applicant.id,
    subject: `DEMO-${index + 1}`,
    category: 'ACCOUNT',
    status: 'WAITING',
  }))

  const auditLogs = [
    { actorId: adminId, action: 'DEMO', targetType: 'KYC_APPLICATION', targetId: kycApplications[0]?.id },
    { actorId: adminId, action: 'DEMO', targetType: 'KYC_APPLICATION', targetId: kycApplications[1]?.id },
    { actorId: adminId, action: 'DEMO', targetType: 'TICKET', targetId: tickets[0]?.requesterId },
  ]

  return {
    kycApplications,
    kycAppeals,
    tickets,
    auditLogs,
  }
}

export async function seedDemoData() {
  await seedDefaults()
  return { seeded: true }
}
