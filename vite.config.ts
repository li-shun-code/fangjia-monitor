import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages 项目页部署时设 PAGES_BASE=/fangjia-monitor/（deploy.yml 已配），本地开发/预览走默认 /
export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
})
