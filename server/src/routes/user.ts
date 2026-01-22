import { Hono } from 'hono'
import { getUserDetail } from '../controllers/user'
import { authMiddleware } from '../middlewares/auth'

const router = new Hono()

router.get('/user/detail', authMiddleware, getUserDetail)

export const userRoutes = router
