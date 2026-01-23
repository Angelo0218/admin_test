/**********************************
 * @Description: Ticket API
 **********************************/

import { request } from '@/utils'

export default {
  list: params => request.get('/tickets', { params }),
  create: data => request.post('/tickets', data),
  getDetail: id => request.get(`/tickets/${id}`),
  reply: (id, data) => request.post(`/tickets/${id}/reply`, data),
  updateStatus: (id, data) => request.post(`/tickets/${id}/status`, data),
  updateMeta: (id, data) => request.post(`/tickets/${id}/update`, data),
}
