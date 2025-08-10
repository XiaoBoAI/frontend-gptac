import type { ProgressInfo } from 'electron-updater'
import { useCallback, useEffect, useState } from 'react'
import Modal from '@/components/update/Modal'
import Progress from '@/components/update/Progress'
import { isElectron, hasIpcRenderer, safeElectronCall } from '@/utils/runtime'
import './update.css'

const Update = () => {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>()
  const [updateError, setUpdateError] = useState<ErrorType>()
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>()
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string
    okText?: string
    onCancel?: () => void
    onOk?: () => void
  }>({
    onCancel: () => setModalOpen(false),
    onOk: () => safeElectronCall(() => (window as any).ipcRenderer.invoke('start-download')),
  })

  const checkUpdate = async () => {
    if (!hasIpcRenderer()) {
      console.warn('Update check is only available in Electron mode')
      return
    }

    setChecking(true)
    /**
     * @type {import('electron-updater').UpdateCheckResult | null | { message: string, error: Error }}
     */
    const result = await safeElectronCall(() => (window as any).ipcRenderer.invoke('check-update'))
    setProgressInfo({ percent: 0 })
    setChecking(false)
    setModalOpen(true)
    if (result?.error) {
      setUpdateAvailable(false)
      setUpdateError(result?.error)
    }
  }

  const onUpdateCanAvailable = useCallback((_event: any, arg1: VersionInfo) => {
    setVersionInfo(arg1)
    setUpdateError(undefined)
    // Can be update
    if (arg1.update) {
      setModalBtn(state => ({
        ...state,
        cancelText: 'Cancel',
        okText: 'Update',
        onOk: () => safeElectronCall(() => (window as any).ipcRenderer.invoke('start-download')),
      }))
      setUpdateAvailable(true)
    } else {
      setUpdateAvailable(false)
    }
  }, [])

  const onUpdateError = useCallback((_event: any, arg1: ErrorType) => {
    setUpdateAvailable(false)
    setUpdateError(arg1)
  }, [])

  const onDownloadProgress = useCallback((_event: any, arg1: ProgressInfo) => {
    setProgressInfo(arg1)
  }, [])

  const onUpdateDownloaded = useCallback((_event: any, ...args: any[]) => {
    setProgressInfo({ percent: 100 })
    setModalBtn(state => ({
      ...state,
      cancelText: 'Later',
      okText: 'Install now',
      onOk: () => safeElectronCall(() => (window as any).ipcRenderer.invoke('quit-and-install')),
    }))
  }, [])

  useEffect(() => {
    // 只在 Electron 模式下设置事件监听器
    if (!hasIpcRenderer()) {
      return
    }

    const ipcRenderer = (window as any).ipcRenderer

    // Get version information and whether to update
    ipcRenderer.on('update-can-available', onUpdateCanAvailable)
    ipcRenderer.on('update-error', onUpdateError)
    ipcRenderer.on('download-progress', onDownloadProgress)
    ipcRenderer.on('update-downloaded', onUpdateDownloaded)

    return () => {
      if (hasIpcRenderer()) {
        const ipcRenderer = (window as any).ipcRenderer
        ipcRenderer.off('update-can-available', onUpdateCanAvailable)
        ipcRenderer.off('update-error', onUpdateError)
        ipcRenderer.off('download-progress', onDownloadProgress)
        ipcRenderer.off('update-downloaded', onUpdateDownloaded)
      }
    }
  }, [])

  // 在 Web 模式下不显示更新组件
  if (!isElectron()) {
    return null
  }

  return (
    <>
      <Modal
        open={modalOpen}
        cancelText={modalBtn?.cancelText}
        okText={modalBtn?.okText}
        onCancel={modalBtn?.onCancel}
        onOk={modalBtn?.onOk}
        footer={updateAvailable ? /* hide footer */null : undefined}
      >
        <div className='modal-slot'>
          {updateError
            ? (
              <div>
                <p>Error downloading the latest version.</p>
                <p>{updateError.message}</p>
              </div>
            ) : updateAvailable
              ? (
                <div>
                  <div>The last version is: v{versionInfo?.newVersion}</div>
                  <div className='new-version__target'>v{versionInfo?.version} -&gt; v{versionInfo?.newVersion}</div>
                  <div className='update__progress'>
                    <div className='progress__title'>Update progress:</div>
                    <div className='progress__bar'>
                      <Progress percent={progressInfo?.percent} ></Progress>
                    </div>
                  </div>
                </div>
              )
              : (
                <div className='can-not-available'>{JSON.stringify(versionInfo ?? {}, null, 2)}</div>
              )}
        </div>
      </Modal>
    </>
  )
}

// 导出供外部调用的更新检查函数
export const checkForUpdates = async () => {
  if (!hasIpcRenderer()) {
    console.warn('Update check is only available in Electron mode')
    return null
  }

  return safeElectronCall(() => (window as any).ipcRenderer.invoke('check-update'))
}

export default Update
