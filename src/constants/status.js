// 狀態轉移規則：前端僅提示，實際以後端為準。
export const KYC_TRANSITIONS = {
  PENDING: ['NEED_MORE', 'PASSED', 'REJECTED'],
  NEED_MORE: ['PASSED', 'REJECTED'],
}

export const TICKET_TRANSITIONS = {
  WAITING: ['IN_PROGRESS'],
  IN_PROGRESS: ['CLOSED'],
}
