/**********************************
 * @Description: User API
 **********************************/

import { request } from '@/utils'

export default {
  /** @param {Record<string, any>} params */
  list: params => request.get('/users', { params }),
  /** @param {string | number} id */
  getDetail: id => request.get(`/users/${id}`),
  /** @param {Record<string, any>} data */
  create: data => request.post('/users', data),
  /** @param {string | number} id @param {Record<string, any>} data */
  remove: (id, data) => request.post(`/users/${id}/delete`, data),
}
