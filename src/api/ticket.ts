/**********************************
 * @Description: Ticket API
 **********************************/

import { request } from '@/utils'

export default {
  /** @param {Record<string, any>} params */
  list: params => request.get('/tickets', { params }),
  /** @param {string | number} id */
  getDetail: id => request.get(`/tickets/${id}`),
  /** @param {string | number} id @param {Record<string, any>} data */
  reply: (id, data) => request.post(`/tickets/${id}/reply`, data),
  /** @param {string | number} id @param {Record<string, any>} data */
  updateStatus: (id, data) => request.post(`/tickets/${id}/status`, data),
  /** @param {string | number} id @param {Record<string, any>} data */
  updateMeta: (id, data) => request.post(`/tickets/${id}/update`, data),
}
