import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/volcengine-design-tokens.css'
import './styles/feishu-layout.scss'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { Vue3DriverPlugin } from '@gfmois/vue3-driver'
import 'driver.js/dist/driver.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})
app.use(Vue3DriverPlugin)
app.mount('#app')
