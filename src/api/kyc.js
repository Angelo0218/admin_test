/**********************************
 * @Description: KYC API
 **********************************/

import { request } from '@/utils'

export default {
  getPendingList: params => request.get('/kyc/applications', {
    params: {
      status: 'PENDING',
      assignedTo: 'me',
      ...params,
    },
  }),
  getDetail: id => request.get(`/kyc/applications/${id}`),
  audit: (id, data) => request.post(`/kyc/applications/${id}/audit`, data),
  assign: (id, data) => request.post(`/kyc/applications/${id}/assign`, data),
  reset: (id, data) => request.post(`/kyc/applications/${id}/reset`, data),
  getHistory: params => request.get('/kyc/applications/history', { params }),
  getAuditors: () => request.get('/kyc/auditors'),
}
