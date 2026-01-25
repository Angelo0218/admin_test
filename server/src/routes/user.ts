import { Hono } from 'hono'
import {
  createUserAccountHandler,
  deleteUserAccountHandler,
  disableUserAccount,
  enableUserAccount,
  getCurrentUser,
  getUserById,
  listUserAccounts,
} from '../controllers/user'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams, validateQuery } from '../middlewares/validate'
import { idParamSchema, userCreateSchema, userDeleteSchema, userDisableSchema, userListQuerySchema } from '../schemas/user'

const router = new Hono()

router.use('/user/*', authMiddleware)
router.use('/users', authMiddleware)
router.use('/users/*', authMiddleware)

router.get('/user/detail', getCurrentUser)
router.get('/users', validateQuery(userListQuerySchema), listUserAccounts)
router.post('/users', validateJson(userCreateSchema), createUserAccountHandler)
router.get('/users/:id', validateParams(idParamSchema), getUserById)
router.post('/users/:id/disable', validateParams(idParamSchema), validateJson(userDisableSchema), disableUserAccount)
router.post('/users/:id/enable', validateParams(idParamSchema), enableUserAccount)
router.post('/users/:id/delete', validateParams(idParamSchema), validateJson(userDeleteSchema), deleteUserAccountHandler)

export const userRoutes = router
