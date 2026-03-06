import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'online-booking': path.resolve(__dirname, 'online-booking.html'),
      },
    },
  },
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
