import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/gatyo-site/',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
  ssr: { noExternal: ['gsap', 'lenis'] },
})
