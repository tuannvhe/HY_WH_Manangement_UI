import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'react-core'
            if (id.includes('@ant-design/icons'))                   return 'antd-icons'
            if (id.includes('antd'))                                return 'antd'
            if (id.includes('recharts'))                            return 'charts'
            if (id.includes('dayjs') || id.includes('axios'))       return 'utils'
          }
        }
      }
    }
  }
})