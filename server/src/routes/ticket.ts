import { Hono } from 'hono'
import {
  changeTicketStatus,
  getTicketInfo,
  listTicketItems,
  replyTicket,
  updateTicketInfo,
} from '../controllers/ticket'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams } from '../middlewares/validate'
import {
  idParamSchema,
  ticketReplySchema,
  ticketStatusSchema,
  ticketUpdateSchema,
} from '../schemas/ticket'

const router = new Hono()

router.use('/tickets', authMiddleware)
router.use('/tickets/*', authMiddleware)

router.get('/tickets', listTicketItems)
router.get('/tickets/:id', validateParams(idParamSchema), getTicketInfo)
router.post('/tickets/:id/reply', validateParams(idParamSchema), validateJson(ticketReplySchema), replyTicket)
router.post('/tickets/:id/status', validateParams(idParamSchema), validateJson(ticketStatusSchema), changeTicketStatus)
router.post('/tickets/:id/update', validateParams(idParamSchema), validateJson(ticketUpdateSchema), updateTicketInfo)

export const ticketRoutes = router
