/**********************************
 * @Description: Role API
 **********************************/

import { request } from '@/utils'

export default {
  list: () => request.get('/roles'),
  /** @param {string | number} id @param {Record<string, any>} data */
  updatePermissions: (id, data) => request.post(`/roles/${id}/permissions`, data),
}
