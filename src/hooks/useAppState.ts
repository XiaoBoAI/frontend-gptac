import { create } from 'zustand'

interface TokenSpeed {
  lastTimestamp: number
  tokenSpeed: number
  tokenCount: number
  message?: string
}

interface StreamingContent {
  thread_id?: string
  content?: string
}

interface AppState {
  tokenSpeed: TokenSpeed | null
  streamingContent: StreamingContent | null
  updateTokenSpeed: (messageId: string, increment?: number) => void
  setTokenSpeed: (messageId: string, speed: number, completionTokens: number) => void
  resetTokenSpeed: () => void
  updateStreamingContent: (content: StreamingContent | null) => void
}

export const useAppState = create<AppState>((set) => ({
  tokenSpeed: null,
  streamingContent: null,
  
  // 更新 token 速度（流式传输中调用）
  updateTokenSpeed: (messageId: string, increment = 1) =>
    set((state) => {
      const currentTimestamp = new Date().getTime() // 获取当前时间戳（毫秒）
      
      if (!state.tokenSpeed) {
        // 如果是第一次更新，只设置初始时间戳
        return {
          tokenSpeed: {
            lastTimestamp: currentTimestamp,
            tokenSpeed: 0,
            tokenCount: increment,
            message: messageId,
          },
        }
      }

      // 计算时间差（秒）
      const timeDiffInSeconds =
        (currentTimestamp - state.tokenSpeed.lastTimestamp) / 1000
      
      // 计算总 token 数
      const totalTokenCount = state.tokenSpeed.tokenCount + increment
      
      // 计算平均 token 速度
      const averageTokenSpeed =
        totalTokenCount / (timeDiffInSeconds > 0 ? timeDiffInSeconds : 1)
      
      return {
        tokenSpeed: {
          ...state.tokenSpeed,
          tokenSpeed: averageTokenSpeed,
          tokenCount: totalTokenCount,
          message: messageId,
        },
      }
    }),

  // 直接设置 token 速度（非流式传输时调用）
  setTokenSpeed: (messageId: string, speed: number, completionTokens: number) => {
    set((state) => ({
      tokenSpeed: {
        ...state.tokenSpeed,
        lastTimestamp: new Date().getTime(),
        tokenSpeed: speed,
        tokenCount: completionTokens,
        message: messageId,
      },
    }))
  },

  // 重置 token 速度
  resetTokenSpeed: () =>
    set({
      tokenSpeed: null,
    }),

  // 设置流式内容
  updateStreamingContent: (streamingContent) => set({ streamingContent }),
}))

