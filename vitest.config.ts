// import { defineConfig } from 'vitest/config'
// import { loadEnv } from 'vite'

// export default defineConfig(({ mode }) => {
//   // Load env file based on `mode` in the current working directory.
//   const env = loadEnv(mode, process.cwd())

//   // Ensure HTTP_URL is properly set with fallback
//   const httpUrl =  `http://localhost:${env.VITE_WEBSOCKET_PORT}`

//   return {
//     test: {
//       root: __dirname,
//       include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
//       testTimeout: 1000 * 29,
//     },
//     server: {
//       proxy: httpUrl ? {
//         '/upload': {
//           target: `${httpUrl}/upload`,
//           changeOrigin: true,
//           secure: false,
//         },
//         '/core_functional': {
//           target: `${httpUrl}/core_functional`,
//           changeOrigin: true,
//           secure: false,
//         },
//       } : undefined,
//     },
//   }
// })
