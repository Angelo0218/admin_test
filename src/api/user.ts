/**********************************
 * @Description: User API
 **********************************/

import { request } from '@/utils'

export default {
  /** @param {Record<string, any>} params */
  list: params => request.get('/users', { params }),
  /** @param {string | number} id */
  getDetail: id => request.get(`/users/${id}`),
  /** @param {string | number} id @param {Record<string, any>} data */
  disable: (id, data) => request.post(`/users/${id}/disable`, data),
  /** @param {string | number} id */
  enable: id => request.post(`/users/${id}/enable`),
  /** @param {string | number} id @param {Record<string, any>} data */
  resetPassword: (id, data) => request.post(`/users/${id}/reset-password`, data),
}
