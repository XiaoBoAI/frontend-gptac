/**
 * 运行模式检测工具
 */

// 检查是否在 Electron 环境中运行
export const isElectron = (): boolean => {
  // 编译时检查
  if (typeof __IS_ELECTRON__ !== 'undefined') {
    return __IS_ELECTRON__
  }

  // 运行时检查 (备用方案)
  return !!(window && window.process && window.process.type === 'renderer')
}

// 检查是否在 Web 环境中运行
export const isWeb = (): boolean => {
  return !isElectron()
}

// 获取应用模式
export const getAppMode = (): 'electron' | 'web' => {
  if (typeof __APP_MODE__ !== 'undefined') {
    return __APP_MODE__
  }
  return isElectron() ? 'electron' : 'web'
}

// 安全地调用 Electron API
export const safeElectronCall = <T>(
  electronFn: () => T,
  fallback?: () => T
): T | undefined => {
  if (isElectron() && window.ipcRenderer) {
    try {
      return electronFn()
    } catch (error) {
      console.warn('Electron API call failed:', error)
      return fallback?.()
    }
  }
  return fallback?.()
}

// 检查 IPC Renderer 是否可用
export const hasIpcRenderer = (): boolean => {
  return isElectron() && !!(window as any).ipcRenderer
}
