import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CodeblockState {
  codeBlockStyle: string
  showLineNumbers: boolean
  setCodeBlockStyle: (style: string) => void
  setShowLineNumbers: (show: boolean) => void
}

export const useCodeblock = create<CodeblockState>()(
  persist(
    (set) => ({
      codeBlockStyle: 'one-light',
      showLineNumbers: true,
      setCodeBlockStyle: (style) => set({ codeBlockStyle: style }),
      setShowLineNumbers: (show) => set({ showLineNumbers: show }),
    }),
    {
      name: 'codeblock-storage',
    }
  )
)

