import { Hono } from 'hono'
import { listAuditRecords } from '../controllers/audit'
import { authMiddleware } from '../middlewares/auth'

const router = new Hono()

router.use('/audit/*', authMiddleware)

router.get('/audit/logs', listAuditRecords)

export const auditRoutes = router
