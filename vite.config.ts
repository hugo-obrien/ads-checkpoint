import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/ads-checkpoint/',
  publicDir: 'front/public',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      // Фронтенд (вьюхи, компоненты, стили, роутер, composables).
      '@': fileURLToPath(new URL('./front', import.meta.url)),
      // Рабочий код (algorithms, workers).
      '@core': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})