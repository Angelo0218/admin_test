import { request } from '@/utils'

export default {
  getUser: () => request.get('/user/detail'),
  refreshToken: () => request.post('/auth/refresh/token', {}, { needToken: false }),
  logout: () => request.post('/auth/logout', {}, { needTip: false }),
  switchCurrentRole: role => request.post('/auth/role/toggle', { role }),
}
