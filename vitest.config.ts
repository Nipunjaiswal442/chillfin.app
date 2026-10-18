import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  test: {
    // Convex function tests opt into `edge-runtime` with a file-level pragma
    server: { deps: { inline: ['convex-test'] } },
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
