import { Hono } from 'hono'
import {
  changeTicketStatus,
  createTicketItem,
  getTicketInfo,
  listTicketItems,
  replyTicket,
  updateTicketInfo,
} from '../controllers/ticket'
import { authMiddleware } from '../middlewares/auth'
import { validateJson, validateParams, validateQuery } from '../middlewares/validate'
import {
  idParamSchema,
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketReplySchema,
  ticketStatusSchema,
  ticketUpdateSchema,
} from '../schemas/ticket'

const router = new Hono()

router.use('/tickets', authMiddleware)
router.use('/tickets/*', authMiddleware)

router.get('/tickets', validateQuery(ticketListQuerySchema), listTicketItems)
router.post('/tickets', validateJson(ticketCreateSchema), createTicketItem)
router.get('/tickets/:id', validateParams(idParamSchema), getTicketInfo)
router.post('/tickets/:id/reply', validateParams(idParamSchema), validateJson(ticketReplySchema), replyTicket)
router.post('/tickets/:id/status', validateParams(idParamSchema), validateJson(ticketStatusSchema), changeTicketStatus)
router.post('/tickets/:id/update', validateParams(idParamSchema), validateJson(ticketUpdateSchema), updateTicketInfo)

export const ticketRoutes = router
