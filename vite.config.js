import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // <--- Agrega esto (punto y barra)
  plugins: [react()],
  define: {
    global: 'window',
  },
})
