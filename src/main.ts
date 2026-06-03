/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 应用入口，初始化 Vue、Pinia、Router
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AppProvider from '@/app/providers/AppProvider.vue'
import router from '@/app/router'

import './styles.css'

const app = createApp(AppProvider)

app.use(createPinia())
app.use(router)
app.mount('#app')
