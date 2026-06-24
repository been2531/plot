import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // '@/' 경로 별칭: src/components/Button → @/components/Button
      '@': path.resolve(__dirname, './src'),
    },
  },
})
