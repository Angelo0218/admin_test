export type RoleCode = 'AUDITOR' | 'SUPER_ADMIN'

export interface User {
  id: string
  username: string
  displayName: string
  role: RoleCode
}

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESET'

export interface KycDocument {
  id: string
  type: 'ID_FRONT' | 'ID_BACK' | 'SELFIE'
  url: string
}

export interface AuditRecord {
  id: string
  action: 'APPROVED' | 'REJECTED' | 'RESET'
  auditorId: string
  auditorName: string
  comment?: string
  createdAt: string
}

export interface KycApplication {
  id: string
  userId: string
  fullName: string
  idNumber: string
  nationality?: string
  status: KycStatus
  submittedAt: string
  updatedAt: string
  assignedAuditorId?: string
  assignedAuditorName?: string
  documents: KycDocument[]
  lastAudit?: AuditRecord
}
