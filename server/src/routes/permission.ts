import { Hono } from 'hono'
import { getPermissionTree, validateMenuPath } from '../controllers/permission'
import { authMiddleware } from '../middlewares/auth'
import { validateJson } from '../middlewares/validate'
import { permissionValidateSchema } from '../schemas/permission'

const router = new Hono()

router.get('/role/permissions/tree', authMiddleware, getPermissionTree)
router.post('/permission/menu/validate', authMiddleware, validateJson(permissionValidateSchema), validateMenuPath)

export const permissionRoutes = router
