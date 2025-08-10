
// Electron IPC 演示代码
import { hasIpcRenderer } from '../utils/runtime'

if (hasIpcRenderer()) {
  const { ipcRenderer } = window as any

  ipcRenderer.on('main-process-message', (_event: any, ...args: any[]) => {
    console.log('[Receive Main-process message]:', ...args)
  })
}

export {}
