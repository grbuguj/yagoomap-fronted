import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // 로컬 개발 시 /api 요청을 백엔드로 프록시 (CORS 우회)
      // 백엔드 포트가 다르면 target 수정
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
