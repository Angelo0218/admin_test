import { prisma } from '../db/client'

export async function seedDefaults() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return
  }

  const superAdminRole = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {},
    create: { code: 'SUPER_ADMIN', name: 'Super Admin' },
  })

  const auditorRole = await prisma.role.upsert({
    where: { code: 'AUDITOR' },
    update: {},
    create: { code: 'AUDITOR', name: 'Auditor' },
  })

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: '123456',
      displayName: 'Admin',
      roles: {
        create: [
          { roleId: superAdminRole.id },
          { roleId: auditorRole.id },
        ],
      },
    },
  })

  const auditor = await prisma.user.create({
    data: {
      username: 'auditor',
      passwordHash: '123456',
      displayName: 'Auditor A',
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

  await prisma.kycApplication.create({
    data: {
      id: 'KYC_1001',
      userId: applicant1.id,
      fullName: 'Wang XiaoMing',
      idNumber: 'A123456789',
      status: 'PENDING',
      assignedAuditorId: auditor.id,
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'ID_BACK', url: 'https://cdn.example.com/kyc/back.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
    },
  })

  await prisma.kycApplication.create({
    data: {
      id: 'KYC_1002',
      userId: applicant2.id,
      fullName: 'Chen YuLing',
      idNumber: 'B223456789',
      status: 'PENDING',
      assignedAuditorId: admin.id,
      documents: {
        create: [
          { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
          { type: 'ID_BACK', url: 'https://cdn.example.com/kyc/back.jpg' },
          { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
        ],
      },
    },
  })
}
