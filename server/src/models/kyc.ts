import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'

interface KycDocumentInput {
  type: string
  url: string
}

export interface KycListParams {
  status?: string
  keyword?: string
  page: number
  pageSize: number
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

export interface KycAppealListParams {
  status?: string
  keyword?: string
  page: number
  pageSize: number
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

export async function listApplications({ status, keyword, page, pageSize }: KycListParams) {
  const where: Prisma.KycApplicationWhereInput = {}
  if (status) {
    where.status = status
  }
  if (keyword) {
    where.OR = [
      { fullName: { contains: keyword } },
      { idNumber: { contains: keyword } },
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.kycApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { displayName: true } },
      },
    }),
    prisma.kycApplication.count({ where }),
  ])

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
    page,
    pageSize,
    total,
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
  const application = await prisma.kycApplication.update({
    where: { id },
    data: {
      status: action,
      reviews: {
        create: {
          action,
          reviewerId,
          comment: comment || undefined,
        },
      },
    },
  })

  return {
    id: application.id,
    status: application.status,
    reviewedAt: application.updatedAt.toISOString(),
  }
}

export async function listAppeals({ status, keyword, page, pageSize }: KycAppealListParams) {
  const where: Prisma.KycAppealWhereInput = {}
  if (status) {
    where.status = status
  }
  if (keyword) {
    where.OR = [
      { reason: { contains: keyword } },
      {
        application: {
          OR: [
            { fullName: { contains: keyword } },
            { idNumber: { contains: keyword } },
          ],
        },
      },
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.kycAppeal.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: { id: true, fullName: true, idNumber: true, status: true },
        },
        handledBy: { select: { displayName: true } },
      },
    }),
    prisma.kycAppeal.count({ where }),
  ])

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
    page,
    pageSize,
    total,
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

// KYC 狀態轉移規則：後端為唯一準則，前端僅做提示與避免 400.
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
