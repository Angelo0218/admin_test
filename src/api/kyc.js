/**********************************
 * @Description: KYC API
 **********************************/

import { request } from '@/utils'

export default {
  list: params => request.get('/kyc/applications', { params }),
  create: data => request.post('/kyc/applications', data),
  getDetail: id => request.get(`/kyc/applications/${id}`),
  review: (id, data) => request.post(`/kyc/applications/${id}/review`, data),
  listAppeals: params => request.get('/kyc/appeals', { params }),
  createAppeal: (id, data) => request.post(`/kyc/applications/${id}/appeals`, data),
  resolveAppeal: (id, data) => request.post(`/kyc/appeals/${id}/resolve`, data),
}
