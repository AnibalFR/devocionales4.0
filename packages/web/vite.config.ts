import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generar BUILD_ID único para cada build
const BUILD_ID = process.env.BUILD_ID || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inyectar BUILD_ID como variable global
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
  },
  build: {
    rollupOptions: {
      output: {
        // Generar nombres con hash para cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
})
