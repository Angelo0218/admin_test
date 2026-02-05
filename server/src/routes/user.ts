import { Hono } from 'hono'
import {
  changePasswordHandler,
  createUserAccountHandler,
  deleteUserAccountHandler,
  getCurrentUser,
  getUserById,
  listUserAccounts,
} from '../controllers/user'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams, validateQuery } from '../middlewares/validate'
import { idParamSchema, userCreateSchema, userDeleteSchema, userListQuerySchema, userPasswordChangeSchema } from '../schemas/user'

const router = new Hono()

router.use('/user/*', authMiddleware)
router.use('/users', authMiddleware)
router.use('/users/*', authMiddleware)

router.get('/user/detail', getCurrentUser)
router.post('/user/password', validateJson(userPasswordChangeSchema), changePasswordHandler)
router.get('/users', validateQuery(userListQuerySchema), listUserAccounts)
router.post('/users', validateJson(userCreateSchema), createUserAccountHandler)
router.get('/users/:id', validateParams(idParamSchema), getUserById)
router.post('/users/:id/delete', validateParams(idParamSchema), validateJson(userDeleteSchema), deleteUserAccountHandler)

export const userRoutes = router
