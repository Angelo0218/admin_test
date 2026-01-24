import { prisma } from '../db/client'

export async function seedDefaults() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return
  }

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: '管理員' },
  })

  const supportRole = await prisma.role.upsert({
    where: { code: 'SUPPORT' },
    update: {},
    create: { code: 'SUPPORT', name: '客服' },
  })

  const auditorRole = await prisma.role.upsert({
    where: { code: 'AUDITOR' },
    update: {},
    create: { code: 'AUDITOR', name: '審核員' },
  })

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: '123456',
      displayName: '管理員',
      roles: {
        create: [{ roleId: adminRole.id }],
      },
    },
  })

  const support = await prisma.user.create({
    data: {
      username: 'support',
      passwordHash: '123456',
      displayName: '客服',
      roles: {
        create: [{ roleId: supportRole.id }],
      },
    },
  })

  const auditor = await prisma.user.create({
    data: {
      username: 'auditor',
      passwordHash: '123456',
      displayName: '審核員 A',
      roles: {
        create: [{ roleId: auditorRole.id }],
      },
    },
  })

  const applicant1 = await prisma.user.create({
    data: {
      username: 'user1',
      passwordHash: 'nopass',
      displayName: 'Wang XiaoMing',
    },
  })

  const applicant2 = await prisma.user.create({
    data: {
      username: 'user2',
      passwordHash: 'nopass',
      displayName: 'Chen YuLing',
    },
  })

  const _kycPending = await prisma.kycApplication.create({
    data: {
      id: 'KYC_1001',
      userId: applicant1.id,
      fullName: 'Wang XiaoMing',
      idNumber: 'A123456789',
      documentType: 'ID_CARD',
      phone: '0912345678',
      status: 'PENDING',
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
    },
  })

  const kycNeedMore = await prisma.kycApplication.create({
    data: {
      id: 'KYC_1002',
      userId: applicant2.id,
      fullName: 'Chen YuLing',
      idNumber: 'B223456789',
      documentType: 'ID_CARD',
      phone: '0987654321',
      status: 'NEED_MORE',
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
      reviews: {
        create: [
          {
            action: 'NEED_MORE',
            reviewerId: auditor.id,
            comment: '請補上自拍照',
          },
        ],
      },
    },
  })

  const kycRejected = await prisma.kycApplication.create({
    data: {
      id: 'KYC_1003',
      userId: applicant1.id,
      fullName: 'Wang XiaoMing',
      idNumber: 'A123456789',
      documentType: 'ID_CARD',
      phone: '0912345678',
      status: 'REJECTED',
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
      reviews: {
        create: [
          {
            action: 'REJECTED',
            reviewerId: auditor.id,
            comment: '資料不符',
          },
        ],
      },
    },
  })

  const kycPassed = await prisma.kycApplication.create({
    data: {
      id: 'KYC_1004',
      userId: applicant2.id,
      fullName: 'Chen YuLing',
      idNumber: 'B223456789',
      documentType: 'ID_CARD',
      phone: '0987654321',
      status: 'PASSED',
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
      reviews: {
        create: [
          {
            action: 'PASSED',
            reviewerId: admin.id,
            comment: '審核通過',
          },
        ],
      },
    },
  })

  await prisma.kycAppeal.create({
    data: {
      applicationId: kycRejected.id,
      status: 'PENDING',
      reason: '資料有誤，請重新審核',
    },
  })

  await prisma.kycAppeal.create({
    data: {
      applicationId: kycNeedMore.id,
      status: 'APPROVED',
      reason: '補件已完成',
      decisionComment: '已確認，通過申訴',
      handledById: admin.id,
      handledAt: new Date(),
    },
  })

  const ticket1 = await prisma.ticket.create({
    data: {
      requesterId: applicant1.id,
      subject: '無法登入帳號',
      category: 'ACCOUNT',
      status: 'WAITING',
      tags: 'login,account',
      internalNote: '等待客服回覆',
    },
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      requesterId: applicant2.id,
      subject: '票務問題詢問',
      category: 'TICKET',
      status: 'IN_PROGRESS',
      tags: 'ticket,question',
    },
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      requesterId: applicant1.id,
      subject: '其他問題',
      category: 'OTHER',
      status: 'CLOSED',
      tags: 'other',
    },
  })

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket1.id,
        senderId: support.id,
        message: '你好，我們已收到你的問題，正在處理中。',
      },
      {
        ticketId: ticket2.id,
        senderId: support.id,
        message: '請提供更多詳細資訊以協助處理。',
      },
      {
        ticketId: ticket3.id,
        senderId: support.id,
        message: '問題已解決，如有需要請再聯繫。',
      },
    ],
  })

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'KYC_APPROVE',
        targetType: 'KYC_APPLICATION',
        targetId: kycPassed.id,
        meta: JSON.stringify({ comment: '審核通過' }),
      },
      {
        actorId: auditor.id,
        action: 'KYC_REJECT',
        targetType: 'KYC_APPLICATION',
        targetId: kycRejected.id,
        meta: JSON.stringify({ comment: '資料不符' }),
      },
      {
        actorId: support.id,
        action: 'TICKET_REPLY',
        targetType: 'TICKET',
        targetId: ticket1.id,
        meta: JSON.stringify({ message: '已收到問題，進行處理中' }),
      },
    ],
  })
}

export async function seedDemoData() {
  await seedDefaults()
  return { seeded: true }
}
