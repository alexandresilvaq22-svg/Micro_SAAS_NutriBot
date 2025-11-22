import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Aumenta o limite do aviso para 1000kb (1MB) para evitar alertas em projetos médios
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Divide o código em pedaços menores para carregar mais rápido
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-icons': ['lucide-react'],
        }
      }
    }
  }
})