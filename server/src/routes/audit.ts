import { Hono } from 'hono'
import { listAuditRecords } from '../controllers/audit'
import { authMiddleware } from '../middlewares/auth'
import { validateQuery } from '../middlewares/validate'
import { auditListQuerySchema } from '../schemas/audit'

const router = new Hono()

router.use('/audit/*', authMiddleware)

router.get('/audit/logs', validateQuery(auditListQuerySchema), listAuditRecords)

export const auditRoutes = router
