export const seedRoles = [
  { code: 'ADMIN', name: 'Admin' },
  { code: 'SUPPORT', name: 'Support' },
  { code: 'AUDITOR', name: 'Auditor' },
]

export const seedUsers = [
  { username: 'admin', displayName: 'Admin', roleCode: 'ADMIN', password: '123456' },
  { username: 'support', displayName: 'Support', roleCode: 'SUPPORT', password: '123456' },
  { username: 'auditor', displayName: 'Auditor', roleCode: 'AUDITOR', password: '123456' },
  { username: 'user1', displayName: 'Wang XiaoMing', roleCode: null, password: 'nopass' },
  { username: 'user2', displayName: 'Chen YuLing', roleCode: null, password: 'nopass' },
]

export const seedKycApplications = [
  {
    id: 'KYC_1001',
    userKey: 'user1',
    fullName: 'Wang XiaoMing',
    idNumber: 'A123456789',
    documentType: 'ID_CARD',
    phone: '0912345678',
    status: 'PENDING',
    documents: [
      { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
      { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
    ],
  },
  {
    id: 'KYC_1002',
    userKey: 'user2',
    fullName: 'Chen YuLing',
    idNumber: 'B223456789',
    documentType: 'ID_CARD',
    phone: '0987654321',
    status: 'NEED_MORE',
    documents: [
      { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
      { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
    ],
    review: {
      action: 'NEED_MORE',
      reviewerKey: 'auditor',
      comment: 'Need clearer documentation',
    },
  },
  {
    id: 'KYC_1003',
    userKey: 'user1',
    fullName: 'Wang XiaoMing',
    idNumber: 'A123456789',
    documentType: 'ID_CARD',
    phone: '0912345678',
    status: 'REJECTED',
    documents: [
      { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
      { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
    ],
    review: {
      action: 'REJECTED',
      reviewerKey: 'auditor',
      comment: 'Information mismatch',
    },
  },
  {
    id: 'KYC_1004',
    userKey: 'user2',
    fullName: 'Chen YuLing',
    idNumber: 'B223456789',
    documentType: 'ID_CARD',
    phone: '0987654321',
    status: 'PASSED',
    documents: [
      { type: 'ID_FRONT', url: 'https://cdn.example.com/kyc/front.jpg' },
      { type: 'SELFIE', url: 'https://cdn.example.com/kyc/selfie.jpg' },
    ],
    review: {
      action: 'PASSED',
      reviewerKey: 'admin',
      comment: 'Approved',
    },
  },
]

export const seedKycAppeals = [
  {
    applicationId: 'KYC_1003',
    status: 'PENDING',
    reason: 'Request re-review due to missing context',
  },
  {
    applicationId: 'KYC_1002',
    status: 'APPROVED',
    reason: 'Additional documents provided',
    decisionComment: 'Verified additional data',
    handledByKey: 'admin',
  },
]

export const seedTickets = [
  {
    requesterKey: 'user1',
    subject: 'Login issues',
    category: 'ACCOUNT',
    status: 'WAITING',
    tags: ['login', 'account'],
    internalNote: 'Check account status',
  },
  {
    requesterKey: 'user2',
    subject: 'Ticket question',
    category: 'TICKET',
    status: 'IN_PROGRESS',
    tags: ['ticket', 'question'],
  },
  {
    requesterKey: 'user1',
    subject: 'Other request',
    category: 'OTHER',
    status: 'CLOSED',
    tags: ['other'],
  },
]

export const seedTicketMessages = [
  {
    ticketIndex: 0,
    senderKey: 'support',
    message: 'We received your report and will respond soon.',
  },
  {
    ticketIndex: 1,
    senderKey: 'support',
    message: 'Thanks for reaching out. We will update you shortly.',
  },
  {
    ticketIndex: 2,
    senderKey: 'support',
    message: 'Your request has been resolved. Let us know if you need more help.',
  },
]

export const seedAuditLogs = [
  {
    actorKey: 'admin',
    action: 'KYC_APPROVE',
    targetType: 'KYC_APPLICATION',
    targetKey: 'KYC_1004',
    meta: { comment: 'Approved' },
  },
  {
    actorKey: 'auditor',
    action: 'KYC_REJECT',
    targetType: 'KYC_APPLICATION',
    targetKey: 'KYC_1003',
    meta: { comment: 'Information mismatch' },
  },
  {
    actorKey: 'support',
    action: 'TICKET_REPLY',
    targetType: 'TICKET',
    targetKeyFromTicketIndex: 0,
    meta: { message: 'We received your report and will respond soon.' },
  },
]
