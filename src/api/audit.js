/**********************************
 * @Description: Audit API
 **********************************/

import { request } from '@/utils'

export default {
  list: params => request.get('/audit/logs', { params }),
}
