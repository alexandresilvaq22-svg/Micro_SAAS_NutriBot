import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Aumenta o limite do aviso para 1500kb para evitar alertas desnecessários
    chunkSizeWarningLimit: 1500, 
    rollupOptions: {
      output: {
        // Função para dividir dependências pesadas em arquivos separados
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Recharts é grande, colocamos em um arquivo separado
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // React e React DOM em outro arquivo
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            // O restante das bibliotecas (ex: lucide-react) vai para vendor
            return 'vendor';
          }
        }
      }
    }
  }
})