import dayjs from 'dayjs'
import { createApp } from 'vue'
import App from './App.vue'
import { setupDirectives } from './directives'
import { i18n } from './locales'
import { setupRouter } from './router'

import { setupStore } from './store'
import { setupNaiveDiscreteApi } from './utils'
import 'dayjs/locale/zh-tw'
import '@/styles/reset.css'
import '@/styles/global.css'
import 'uno.css'

dayjs.locale('zh-tw')

async function bootstrap() {
  const app = createApp(App)
  setupStore(app)
  app.use(i18n)
  setupDirectives(app)
  await setupRouter(app)
  app.mount('#app')
  setupNaiveDiscreteApi()
}

bootstrap()
