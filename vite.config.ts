import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    }
  },
  esbuild: {
    jsx: 'automatic',
  },
})
