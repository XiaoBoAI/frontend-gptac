# Electron 转 Vite Web 应用转换指南

本文档说明了如何将 Electron + Vite + React 桌面应用转换为普通的 Vite Web 应用。

## 转换完成的修改

### 1. package.json 修改
- 移除了 `main` 字段（Electron 入口）
- 移除了 `debug` 配置
- 修改 `dev` 脚本：`vite --port 8080`
- 修改 `build` 脚本：`tsc && vite build`（移除 `electron-builder`）
- 修改 `preview` 脚本：`vite preview --port 8080`

### 2. vite.config.ts 修改
- 移除 `vite-plugin-electron` 插件
- 移除 Electron 相关配置（main、preload、renderer）
- 简化服务器配置，固定端口为 8080
- 保留了 API 代理配置

### 3. src/main.tsx 修改
- 移除 `import './demos/ipc'`（Electron IPC 相关）
- 移除 `postMessage({ payload: 'removeLoading' }, '*')`

### 4. src/vite-env.d.ts 修改
- 移除 Electron API 类型定义
- 移除 `window.ipcRenderer` 接口

### 5. index.html 修改
- 移除 Content Security Policy 元标签
- 更新标题为 "Vite + React Web App"

## 需要手动处理的依赖项

转换后，你可以选择性移除以下 Electron 相关依赖（如果不再需要）：

```bash
npm uninstall electron electron-builder vite-plugin-electron vite-plugin-electron-renderer electron-updater
```

## 需要修改的代码文件

转换后需要检查并修改以下可能使用 Electron API 的文件：

1. **src/demos/ipc.ts** - 使用了 `window.ipcRenderer`，需要移除或替换
2. **src/components/update/** - Electron 更新相关组件，Web 应用不需要
3. 任何使用 `window.electronAPI` 或 `ipcRenderer` 的组件

## 运行指令

### 开发模式
```bash
npm run dev
```
应用将在 http://localhost:8080 运行

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 注意事项

1. **API 通信**：原本通过 Electron IPC 进行的主进程通信需要改为 HTTP API 调用
2. **文件系统访问**：Web 应用无法直接访问本地文件系统，需要通过文件上传 API
3. **系统集成**：无法使用 Electron 的系统集成功能（如系统托盘、桌面通知等）
4. **跨域问题**：Web 应用需要处理 CORS 问题
5. **安全性**：Web 应用有更严格的安全限制

## 下一步建议

1. 测试所有功能是否正常工作
2. 移除未使用的 Electron 相关代码
3. 替换 Electron IPC 调用为 HTTP API 调用
4. 设置适当的 CORS 策略
5. 配置生产环境部署
