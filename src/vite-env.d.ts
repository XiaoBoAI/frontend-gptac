/// <reference types="vite/client" />

// 全局类型定义
declare const __IS_ELECTRON__: boolean
declare const __APP_MODE__: 'electron' | 'web'

// 条件类型定义 - 只在 Electron 模式下可用
interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: typeof __IS_ELECTRON__ extends true ? import('electron').IpcRenderer : never
}
