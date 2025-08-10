import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { isElectron } from './utils/runtime'

import './index.css'

// 只在 Electron 模式下导入 IPC 相关代码
if (isElectron()) {
  import('./demos/ipc').catch(err =>
    console.warn('Failed to load Electron IPC demos:', err)
  )
}

// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 只在 Electron 模式下发送 removeLoading 消息
if (isElectron()) {
  postMessage({ payload: 'removeLoading' }, '*')
}
