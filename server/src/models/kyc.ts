import { prisma } from '../db/client'

interface KycDocumentInput {
  type: string
  url: string
}

export interface KycCreateParams {
  userId: string
  fullName: string
  idNumber: string
  documentType: string
  phone: string
  documents: KycDocumentInput[]
}

export interface KycReviewParams {
  id: string
  action: string
  comment?: string
  reviewerId: string
}

export interface KycAppealCreateParams {
  applicationId: string
  reason: string
}

export interface KycAppealResolveParams {
  id: string
  status: string
  decisionComment?: string
  handledById: string
}

export async function listApplications() {
  const items = await prisma.kycApplication.findMany({
    orderBy: { submittedAt: 'desc' },
    include: {
      user: { select: { displayName: true } },
    },
  })

  return {
    items: items.map(item => ({
      id: item.id,
      fullName: item.fullName,
      idNumber: item.idNumber,
      documentType: item.documentType,
      phone: item.phone,
      status: item.status,
      applicantName: item.user?.displayName || '',
      submittedAt: item.submittedAt.toISOString(),
    })),
  }
}

export async function createApplication({ userId, fullName, idNumber, documentType, phone, documents }: KycCreateParams) {
  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!applicant) {
    return null
  }
  const application = await prisma.kycApplication.create({
    data: {
      userId,
      fullName,
      idNumber,
      documentType,
      phone,
      status: 'PENDING',
      documents: {
        create: documents.map((doc: KycDocumentInput) => ({
          type: doc.type,
          url: doc.url,
        })),
      },
    },
  })

  return {
    id: application.id,
    status: application.status,
    submittedAt: application.submittedAt.toISOString(),
  }
}

export async function getApplicationDetail(id: string) {
  const application = await prisma.kycApplication.findUnique({
    where: { id },
    include: {
      user: { select: { displayName: true } },
      documents: true,
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { displayName: true } },
        },
      },
      appeals: {
        orderBy: { createdAt: 'desc' },
        include: {
          handledBy: { select: { displayName: true } },
        },
      },
    },
  })

  if (!application) {
    return null
  }

  const availableActions = getKycAvailableActions(application.status)
  const availableStatuses = getKycAvailableStatuses(application.status)

  return {
    application: {
      id: application.id,
      userId: application.userId,
      applicantName: application.user?.displayName || '',
      fullName: application.fullName,
      idNumber: application.idNumber,
      documentType: application.documentType,
      phone: application.phone,
      status: application.status,
      submittedAt: application.submittedAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      documents: application.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
        createdAt: doc.createdAt.toISOString(),
      })),
    },
    availableActions,
    availableStatuses,
    reviews: application.reviews.map(record => ({
      id: record.id,
      action: record.action,
      reviewerId: record.reviewerId,
      reviewerName: record.reviewer?.displayName || '',
      comment: record.comment || undefined,
      createdAt: record.createdAt.toISOString(),
    })),
    appeals: application.appeals.map(appeal => ({
      id: appeal.id,
      status: appeal.status,
      reason: appeal.reason || undefined,
      decisionComment: appeal.decisionComment || undefined,
      handledByName: appeal.handledBy?.displayName || '',
      handledAt: appeal.handledAt ? appeal.handledAt.toISOString() : undefined,
      createdAt: appeal.createdAt.toISOString(),
    })),
  }
}

export async function reviewApplication({ id, action, comment, reviewerId }: KycReviewParams) {
  const existing = await prisma.kycApplication.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!existing) {
    return null
  }
  if (!isValidKycTransition(existing.status, action)) {
    return { error: 'INVALID_STATUS' }
  }
  const result = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.kycApplication.updateMany({
      where: { id, status: existing.status },
      data: { status: action },
    })
    if (!updateResult.count) {
      return { error: 'INVALID_STATUS' as const }
    }
    await tx.kycReview.create({
      data: {
        applicationId: id,
        action,
        reviewerId,
        comment: comment || undefined,
      },
    })
    const application = await tx.kycApplication.findUnique({
      where: { id },
      select: { id: true, status: true, updatedAt: true },
    })
    if (!application) {
      return null
    }
    return {
      id: application.id,
      status: application.status,
      reviewedAt: application.updatedAt.toISOString(),
    }
  }, {
    maxWait: 20_000,
    timeout: 20_000,
  })

  if (!result || 'error' in result) {
    return result
  }
  return result
}

export async function listAppeals() {
  const items = await prisma.kycAppeal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      application: {
        select: { id: true, fullName: true, idNumber: true, status: true },
      },
      handledBy: { select: { displayName: true } },
    },
  })

  return {
    items: items.map(item => ({
      id: item.id,
      applicationId: item.applicationId,
      applicantName: item.application.fullName,
      idNumber: item.application.idNumber,
      applicationStatus: item.application.status,
      status: item.status,
      reason: item.reason || undefined,
      decisionComment: item.decisionComment || undefined,
      handledByName: item.handledBy?.displayName || '',
      handledAt: item.handledAt ? item.handledAt.toISOString() : undefined,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

export async function createAppeal({ applicationId, reason }: KycAppealCreateParams) {
  const existing = await prisma.kycApplication.findUnique({
    where: { id: applicationId },
    select: { id: true },
  })
  if (!existing) {
    return null
  }
  const appeal = await prisma.kycAppeal.create({
    data: {
      applicationId,
      reason,
      status: 'PENDING',
    },
  })

  return {
    id: appeal.id,
    status: appeal.status,
    createdAt: appeal.createdAt.toISOString(),
  }
}

export async function resolveAppeal({ id, status, decisionComment, handledById }: KycAppealResolveParams) {
  const existing = await prisma.kycAppeal.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!existing) {
    return null
  }
  if (existing.status !== 'PENDING') {
    return { error: 'INVALID_STATUS' }
  }
  const appeal = await prisma.kycAppeal.update({
    where: { id },
    data: {
      status,
      decisionComment: decisionComment || undefined,
      handledById,
      handledAt: new Date(),
    },
  })

  return {
    id: appeal.id,
    status: appeal.status,
    handledAt: appeal.handledAt ? appeal.handledAt.toISOString() : undefined,
  }
}

// Allowed status transitions; invalid transitions return 400.
const KYC_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['NEED_MORE', 'PASSED', 'REJECTED'],
  NEED_MORE: ['PASSED', 'REJECTED'],
}

export function getKycAvailableActions(status: string) {
  return KYC_TRANSITIONS[status] ?? []
}

export function getKycAvailableStatuses(status: string) {
  return getKycAvailableActions(status)
}

function isValidKycTransition(current: string, next: string) {
  return KYC_TRANSITIONS[current]?.includes(next) ?? false
}
