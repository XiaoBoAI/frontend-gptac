# 混合模式开发指南

本项目现在支持两种运行模式：Electron 桌面应用模式和纯 Web 应用模式。通过环境变量可以灵活切换。

## 环境配置文件

### .env (默认配置 - Web 模式)
```env
VITE_APP_MODE=web
VITE_WEBSOCKET_URL=ws://localhost:28000/main
VITE_UPLOAD_URL=http://localhost:28000/upload
VITE_HTTP_URL=http://localhost:28000
```

### .env.web (Web 模式配置)
```env
VITE_APP_MODE=web
VITE_HTTP_URL=http://localhost:3000
```

### .env.electron (Electron 模式配置)
```env
VITE_APP_MODE=electron
VITE_DEV_SERVER_URL=http://127.0.0.1:7777/
VITE_HTTP_URL=http://localhost:3000
```

## 运行脚本

### Web 模式
```bash
# 开发模式
npm run dev
# 或者明确指定
npm run dev:web

# 构建
npm run build
# 或者明确指定
npm run build:web

# 预览
npm run preview
# 或者明确指定
npm run preview:web
```

### Electron 模式
```bash
# 开发模式
npm run dev:electron

# 构建 (包含打包)
npm run build:electron
```

## 代码中的模式检测

### 运行时检测工具
```typescript
import { isElectron, isWeb, getAppMode, hasIpcRenderer, safeElectronCall } from '@/utils/runtime'

// 检查是否在 Electron 环境
if (isElectron()) {
  // Electron 特定代码
}

// 检查是否在 Web 环境
if (isWeb()) {
  // Web 特定代码
}

// 获取当前运行模式
const mode = getAppMode() // 'electron' | 'web'

// 安全地调用 Electron API
safeElectronCall(
  () => window.ipcRenderer.invoke('some-api'),
  () => console.log('Fallback for web mode')
)
```

### 编译时常量
```typescript
// 这些常量在构建时被替换
if (__IS_ELECTRON__) {
  // 只在 Electron 模式下编译
}

console.log(__APP_MODE__) // 'electron' | 'web'
```

## 组件适配示例

### 条件渲染
```tsx
import { isElectron } from '@/utils/runtime'

const MyComponent = () => {
  if (!isElectron()) {
    // 在 Web 模式下不显示某些组件
    return null
  }

  return (
    <div>
      {/* Electron 专用内容 */}
    </div>
  )
}
```

### 条件功能
```tsx
import { hasIpcRenderer, safeElectronCall } from '@/utils/runtime'

const handleAction = () => {
  if (hasIpcRenderer()) {
    // Electron 模式下的处理
    safeElectronCall(() => window.ipcRenderer.invoke('electron-action'))
  } else {
    // Web 模式下的处理
    fetch('/api/web-action').then(/* ... */)
  }
}
```

## 构建差异

### Web 模式构建
- 不包含 Electron 相关代码
- 输出到 `dist/` 目录
- 适合部署到 Web 服务器

### Electron 模式构建
- 包含完整的 Electron 功能
- 输出到 `dist-electron/` 目录
- 自动执行 electron-builder 打包

## 类型安全

项目使用条件类型确保类型安全：

```typescript
// vite-env.d.ts
declare const __IS_ELECTRON__: boolean
declare const __APP_MODE__: 'electron' | 'web'

interface Window {
  ipcRenderer: typeof __IS_ELECTRON__ extends true ? import('electron').IpcRenderer : never
}
```

这确保了在 Web 模式下访问 `window.ipcRenderer` 会产生类型错误。

## 最佳实践

1. **使用运行时检测工具**：优先使用 `@/utils/runtime` 中的工具函数
2. **优雅降级**：确保 Web 模式下有合适的替代方案
3. **条件导入**：使用动态 import 避免在 Web 模式下加载 Electron 代码
4. **类型安全**：利用 TypeScript 的条件类型确保类型安全

## 部署指南

### Web 模式部署
1. 运行 `npm run build:web`
2. 将 `dist/` 目录部署到 Web 服务器

### Electron 模式发布
1. 运行 `npm run build:electron`
2. 在 `release/` 目录中找到打包好的应用程序

## 故障排除

### 常见问题
1. **类型错误**：确保使用正确的运行时检测
2. **功能缺失**：检查是否正确处理了模式差异
3. **构建失败**：确认环境变量配置正确

### 调试技巧
- 使用 `console.log(getAppMode())` 确认当前模式
- 检查 `__IS_ELECTRON__` 和 `__APP_MODE__` 常量值
- 在浏览器开发工具中检查构建后的代码
