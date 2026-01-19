import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { resolve } from 'path'

/* eslint-env node */
/* global process */
const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  optimizeDeps: {
    include: ['@canvasjs/react-charts', '@canvasjs/charts', 'framer-motion']
  },
  build: {
    // warn when chunks exceed 500kb (adjust as needed)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@canvasjs') || id.includes('canvasjs')) return 'charts';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            return 'vendor';
          }
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
})
