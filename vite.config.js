import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

const port = parseInt(process.env.PORT) || 3000;

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: port,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
