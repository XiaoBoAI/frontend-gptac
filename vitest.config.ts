import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd())

  return {
    test: {
      root: __dirname,
      include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
      testTimeout: 1000 * 29,
    },
    server: {
      proxy: {
        '/upload': {
          target: env.VITE_UPLOAD_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
