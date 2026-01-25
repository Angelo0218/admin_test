import { Hono } from 'hono'
import { getPermissionTree, listRoles, updateRolePermissions } from '../controllers/role'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams } from '../middlewares/validate'
import { idParamSchema, rolePermissionSchema } from '../schemas/role'

const router = new Hono()

router.use('/roles', authMiddleware)
router.use('/roles/*', authMiddleware)

router.get('/roles', listRoles)
router.post('/roles/:id/permissions', validateParams(idParamSchema), validateJson(rolePermissionSchema), updateRolePermissions)
router.get('/role/permissions/tree', authMiddleware, getPermissionTree)

export const roleRoutes = router
