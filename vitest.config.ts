import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

const dirname = path.dirname(fileURLToPath(import.meta.url))

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
      '~': path.resolve(dirname, './src/'),
    },
  }
})
