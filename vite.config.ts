import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd())

  // Ensure HTTP_URL is properly set with fallback
  const httpUrl =  `http://localhost:${env.VITE_WEBSOCKET_PORT}`

  // 判断是否为 Electron 模式
  const isElectronMode = mode === 'electron' || env.VITE_APP_MODE === 'electron'

  // 如果是 electron 模式，清理构建目录
  if (isElectronMode) {
    rmSync('dist-electron', { recursive: true, force: true })
  }

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src')
      },
    },
    plugins: [
      react(),
      ...(isElectronMode
        ? [electron({
            main: {
              // Shortcut of `build.lib.entry`
              entry: 'electron/main/index.ts',
              onstart(args) {
                if (process.env.VSCODE_DEBUG) {
                  console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
                } else {
                  args.startup()
                }
              },
              vite: {
                build: {
                  sourcemap,
                  minify: isBuild,
                  outDir: 'dist-electron/main',
                  rollupOptions: {
                    external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                  },
                },
              },
            },
            preload: {
              // Shortcut of `build.rollupOptions.input`.
              // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
              input: 'electron/preload/index.ts',
              vite: {
                build: {
                  sourcemap: sourcemap ? 'inline' : undefined, // #332
                  minify: isBuild,
                  outDir: 'dist-electron/preload',
                  rollupOptions: {
                    external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                  },
                },
              },
            },
            // Ployfill the Electron and Node.js API for Renderer process.
            // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer: {},
          })]
        : []
      ),
    ],
    server: {
      // Electron 模式下的服务器配置
      ...(isElectronMode && process.env.VSCODE_DEBUG && (() => {
        const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
        return {
          host: url.hostname,
          port: +url.port,
        }
      })()),
      // Web 模式下固定端口
      ...(!isElectronMode && { port: 8080 }),
      proxy: httpUrl ? {
        '/upload': {
          target: httpUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/download': {
          target: httpUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/core_functional': {
          target: httpUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/crazy_functional': {
          target: httpUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
        '/predict_user_input': {
          target: httpUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('http proxy target', httpUrl);
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          }
        },
      } : undefined,
    },
    clearScreen: false,
    define: {
      // 定义全局变量，方便在代码中判断模式
      __IS_ELECTRON__: isElectronMode,
      __APP_MODE__: JSON.stringify(isElectronMode ? 'electron' : 'web'),
    },
  }
})
