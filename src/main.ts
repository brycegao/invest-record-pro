import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AppProvider from '@/app/providers/AppProvider.vue'
import router from '@/app/router'

import './styles.css'

const app = createApp(AppProvider)

app.use(createPinia())
app.use(router)
app.mount('#app')
