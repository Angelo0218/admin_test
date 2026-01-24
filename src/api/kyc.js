/**********************************
 * @Description: KYC API
 **********************************/

import { request } from '@/utils'

export default {
  /** @param {Record<string, any>} params */
  list: params => request.get('/kyc/applications', { params }),
  /** @param {Record<string, any>} data */
  create: data => request.post('/kyc/applications', data),
  /** @param {string | number} id */
  getDetail: id => request.get(`/kyc/applications/${id}`),
  /** @param {string | number} id @param {Record<string, any>} data */
  review: (id, data) => request.post(`/kyc/applications/${id}/review`, data),
  /** @param {Record<string, any>} params */
  listAppeals: params => request.get('/kyc/appeals', { params }),
  /** @param {string | number} id @param {Record<string, any>} data */
  createAppeal: (id, data) => request.post(`/kyc/applications/${id}/appeals`, data),
  /** @param {string | number} id @param {Record<string, any>} data */
  resolveAppeal: (id, data) => request.post(`/kyc/appeals/${id}/resolve`, data),
}
