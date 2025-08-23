import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// 处理文件下载
ipcMain.handle('download-file', async (_, fileUrl: string) => {
  try {
    const { net } = require('electron')
    const fs = require('fs')
    const path = require('path')

    // 构建下载请求
    const formData = new URLSearchParams()
    formData.append('file_path', fileUrl)

    console.log(`准备下载文件，method `+ formData.get('file_path') + ` url: http://localhost:${process.env.VITE_WEBSOCKET_PORT || '58000'}/download`)
    const request = net.request({
      method: 'POST',
      url: `http://localhost:${process.env.VITE_WEBSOCKET_PORT || '58000'}/download`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return new Promise((resolve) => {
      let responseData = Buffer.alloc(0)
      let filename = 'download'

      request.on('response', (response: any) => {
        if (response.statusCode !== 200) {
          resolve({ success: false, error: `HTTP ${response.statusCode}` })
          return
        }

        // 获取文件名
        const contentDisposition = response.headers['content-disposition']
        if (contentDisposition && typeof contentDisposition === 'string') {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        response.on('data', (chunk: Buffer) => {
          responseData = Buffer.concat([responseData, chunk])
        })

        response.on('end', () => {
          try {
            // 获取桌面路径
            const desktopPath = path.join(os.homedir(), 'Desktop')
            const filePath = path.join(desktopPath, filename)

            // 写入文件
            fs.writeFileSync(filePath, responseData)

            resolve({ success: true, filePath })
          } catch (error: any) {
            resolve({ success: false, error: error?.message || '写入文件失败' })
          }
        })
      })

      request.on('error', (error: any) => {
        resolve({ success: false, error: error?.message || '网络请求失败' })
      })

      request.write(formData.toString())
      request.end()
    })
  } catch (error: any) {
    return { success: false, error: error?.message || '下载失败' }
  }
})
