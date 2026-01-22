import { Hono } from 'hono'
import { login, logout, refreshToken, toggleRole } from '../controllers/auth'
import { authMiddleware } from '../middlewares/auth'
import { validateJson } from '../middlewares/validate'
import { loginSchema, roleToggleSchema } from '../schemas/auth'

const router = new Hono()

router.post('/auth/login', validateJson(loginSchema), login)
router.post('/auth/refresh/token', refreshToken)
router.post('/auth/logout', logout)
router.post('/auth/role/toggle', authMiddleware, validateJson(roleToggleSchema), toggleRole)

export const authRoutes = router
