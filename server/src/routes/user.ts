import { Hono } from 'hono'
import {
  disableUserAccount,
  enableUserAccount,
  getCurrentUser,
  getUserById,
  listUserAccounts,
  resetUserPasswordHandler,
} from '../controllers/user'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams, validateQuery } from '../middlewares/validate'
import { idParamSchema, userDisableSchema, userListQuerySchema, userResetPasswordSchema } from '../schemas/user'

const router = new Hono()

router.use('/user/*', authMiddleware)
router.use('/users', authMiddleware)
router.use('/users/*', authMiddleware)

router.get('/user/detail', getCurrentUser)
router.get('/users', validateQuery(userListQuerySchema), listUserAccounts)
router.get('/users/:id', validateParams(idParamSchema), getUserById)
router.post('/users/:id/disable', validateParams(idParamSchema), validateJson(userDisableSchema), disableUserAccount)
router.post('/users/:id/enable', validateParams(idParamSchema), enableUserAccount)
router.post('/users/:id/reset-password', validateParams(idParamSchema), validateJson(userResetPasswordSchema), resetUserPasswordHandler)

export const userRoutes = router
