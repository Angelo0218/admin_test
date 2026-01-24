/**********************************
 * @Description: Audit API
 **********************************/

import { request } from '@/utils'

export default {
  /** @param {Record<string, any>} params */
  list: params => request.get('/audit/logs', { params }),
}
