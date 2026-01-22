import { Hono } from 'hono'
import {
  assignApplicationHandler,
  auditApplicationHandler,
  getApplicationDetailHandler,
  getApplications,
  getAuditors,
  getHistory,
  resetApplicationHandler,
} from '../controllers/kyc'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams, validateQuery } from '../middlewares/validate'
import { assignSchema, auditSchema, idParamSchema, kycHistoryQuerySchema, kycListQuerySchema, resetSchema } from '../schemas/kyc'

const router = new Hono()

router.use('/kyc/*', authMiddleware)

router.get('/kyc/applications', validateQuery(kycListQuerySchema), getApplications)
router.get('/kyc/applications/history', validateQuery(kycHistoryQuerySchema), getHistory)
router.get('/kyc/applications/:id', validateParams(idParamSchema), getApplicationDetailHandler)
router.post('/kyc/applications/:id/audit', validateParams(idParamSchema), validateJson(auditSchema), auditApplicationHandler)
router.post('/kyc/applications/:id/assign', validateParams(idParamSchema), validateJson(assignSchema), assignApplicationHandler)
router.post('/kyc/applications/:id/reset', validateParams(idParamSchema), validateJson(resetSchema), resetApplicationHandler)
router.get('/kyc/auditors', getAuditors)

export const kycRoutes = router
