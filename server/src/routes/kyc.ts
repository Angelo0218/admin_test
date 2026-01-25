import { Hono } from 'hono'
import {
  createKycAppeal,
  createKycApplication,
  getKycDetail,
  listKycAppeals,
  listKycApplications,
  resolveKycAppeal,
  reviewKycApplication,
} from '../controllers/kyc'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams } from '../middlewares/validate'
import {
  idParamSchema,
  kycAppealCreateSchema,
  kycAppealResolveSchema,
  kycCreateSchema,
  kycReviewSchema,
} from '../schemas/kyc'

const router = new Hono()

router.use('/kyc/*', authMiddleware)

router.get('/kyc/applications', listKycApplications)
router.post('/kyc/applications', validateJson(kycCreateSchema), createKycApplication)
router.get('/kyc/applications/:id', validateParams(idParamSchema), getKycDetail)
router.post('/kyc/applications/:id/review', validateParams(idParamSchema), validateJson(kycReviewSchema), reviewKycApplication)
router.post('/kyc/applications/:id/appeals', validateParams(idParamSchema), validateJson(kycAppealCreateSchema), createKycAppeal)

router.get('/kyc/appeals', listKycAppeals)
router.post('/kyc/appeals/:id/resolve', validateParams(idParamSchema), validateJson(kycAppealResolveSchema), resolveKycAppeal)

export const kycRoutes = router
