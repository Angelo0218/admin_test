import { prisma } from '../db/client'
import { hashPassword } from '../utils/password'
import {
  seedAuditLogs,
  seedKycAppeals,
  seedKycApplications,
  seedRoles,
  seedTicketMessages,
  seedTickets,
  seedUsers,
} from './fixtures'

export async function seedRoleMap() {
  const roleMap = new Map()
  for (const role of seedRoles) {
    const record = await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: { code: role.code, name: role.name },
    })
    roleMap.set(role.code, record.id)
  }
  return roleMap
}

export async function seedUserMap(roleMap: Map<string, string>) {
  const userMap = new Map()
  for (const user of seedUsers) {
    const passwordHash = await hashPassword(user.password)
    const created = await prisma.user.create({
      data: {
        username: user.username,
        passwordHash,
        displayName: user.displayName,
        roles: user.roleCode
          ? {
              create: [{ roleId: roleMap.get(user.roleCode) }],
            }
          : undefined,
      },
    })
    userMap.set(user.username, created.id)
  }
  return userMap
}

export async function seedKycApplicationsData(userMap: Map<string, string>) {
  const createdApplications = []
  for (const application of seedKycApplications) {
    const created = await prisma.kycApplication.create({
      data: {
        id: application.id,
        userId: userMap.get(application.userKey),
        fullName: application.fullName,
        idNumber: application.idNumber,
        documentType: application.documentType,
        phone: application.phone,
        status: application.status,
        documents: {
          create: application.documents.map(doc => ({
            type: doc.type,
            url: doc.url,
          })),
        },
        reviews: application.review
          ? {
              create: {
                action: application.review.action,
                reviewerId: userMap.get(application.review.reviewerKey),
                comment: application.review.comment,
              },
            }
          : undefined,
      },
    })
    createdApplications.push(created)
  }
  return createdApplications
}

export async function seedKycAppealsData(applications, userMap: Map<string, string>) {
  for (const appeal of seedKycAppeals) {
    await prisma.kycAppeal.create({
      data: {
        applicationId: appeal.applicationId,
        status: appeal.status,
        reason: appeal.reason,
        decisionComment: appeal.decisionComment,
        handledById: appeal.handledByKey ? userMap.get(appeal.handledByKey) : undefined,
        handledAt: appeal.handledByKey ? new Date() : undefined,
      },
    })
  }
}

export async function seedTicketsData(userMap: Map<string, string>) {
  const createdTickets = []
  for (const ticket of seedTickets) {
    const created = await prisma.ticket.create({
      data: {
        requesterId: userMap.get(ticket.requesterKey),
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        tags: ticket.tags ? JSON.stringify(ticket.tags) : undefined,
        internalNote: ticket.internalNote,
      },
    })
    createdTickets.push(created)
  }
  return createdTickets
}

export async function seedTicketMessagesData(tickets, userMap: Map<string, string>) {
  if (!tickets.length) {
    return
  }
  await prisma.ticketMessage.createMany({
    data: seedTicketMessages.map(message => ({
      ticketId: tickets[message.ticketIndex]?.id,
      senderId: userMap.get(message.senderKey),
      message: message.message,
    })),
  })
}

export async function seedAuditLogsData(applications, tickets, userMap: Map<string, string>) {
  const ticketTargetId = (index: number) => tickets[index]?.id
  const logData = seedAuditLogs.map(log => ({
    actorId: userMap.get(log.actorKey),
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetKey ?? ticketTargetId(log.targetKeyFromTicketIndex ?? -1),
    meta: log.meta ? JSON.stringify(log.meta) : undefined,
  }))
  await prisma.auditLog.createMany({
    data: logData,
  })
}
