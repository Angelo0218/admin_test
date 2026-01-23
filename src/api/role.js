/**********************************
 * @Description: Role API
 **********************************/

import { request } from '@/utils'

export default {
  list: () => request.get('/roles'),
  updatePermissions: (id, data) => request.post(`/roles/${id}/permissions`, data),
}
