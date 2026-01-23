/**********************************
 * @Description: User API
 **********************************/

import { request } from '@/utils'

export default {
  list: params => request.get('/users', { params }),
  getDetail: id => request.get(`/users/${id}`),
  disable: (id, data) => request.post(`/users/${id}/disable`, data),
  enable: id => request.post(`/users/${id}/enable`),
  resetPassword: (id, data) => request.post(`/users/${id}/reset-password`, data),
}
