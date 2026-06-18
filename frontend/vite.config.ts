import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/escuela2.0/',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../docs' },
  server: { port: 5173 },
})
