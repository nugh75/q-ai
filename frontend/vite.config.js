import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      'ai-q-2.ai4educ.org',
      '.ai4educ.org'  // Permette tutti i sottodomini di ai4educ.org
    ]
  }
})
