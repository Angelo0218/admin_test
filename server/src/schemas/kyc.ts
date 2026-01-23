import { z } from 'zod'

const kycStatusEnum = z.enum(['PENDING', 'NEED_MORE', 'PASSED', 'REJECTED'])
const appealStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const kycListQuerySchema = paginationSchema.extend({
  status: kycStatusEnum.optional(),
  keyword: z.string().optional(),
})

export const kycCreateSchema = z.object({
  userId: z.string().min(1),
  fullName: z.string().min(1),
  idNumber: z.string().min(1),
  documentType: z.string().min(1),
  phone: z.string().min(1),
  documents: z.array(z.object({
    type: z.string().min(1),
    url: z.string().min(1),
  })).default([]),
})

export const kycReviewSchema = z.object({
  action: z.enum(['PASSED', 'REJECTED', 'NEED_MORE']),
  comment: z.string().optional(),
})

export const kycAppealListQuerySchema = paginationSchema.extend({
  status: appealStatusEnum.optional(),
  keyword: z.string().optional(),
})

export const kycAppealCreateSchema = z.object({
  reason: z.string().min(1),
})

export const kycAppealResolveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decisionComment: z.string().optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1),
})
