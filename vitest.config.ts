import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  test: {
    environment: "node",
    setupFiles: ['dotenv/config']
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src/'),
    },
  }
})
