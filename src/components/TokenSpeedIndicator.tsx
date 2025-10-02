import { memo } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { toNumber } from '@/utils/number'
import { Gauge } from 'lucide-react'

interface TokenSpeedIndicatorProps {
  metadata?: Record<string, unknown>
  streaming?: boolean
}

const formatSpeed = (value: number) => {
  const numeric = toNumber(value)
  if (numeric >= 10) return Math.round(numeric).toString()
  if (numeric > 0) return numeric.toFixed(1)
  return '0.0'
}

export const TokenSpeedIndicator = memo(({
  metadata,
  streaming,
}: TokenSpeedIndicatorProps) => {
  const streamingTokenSpeed = useAppState(
    (state) => state.tokenSpeed?.tokenSpeed ?? 0
  )
  const persistedTokenSpeed =
    (metadata?.tokenSpeed as { tokenSpeed: number })?.tokenSpeed || 0

  const nonStreamingAssistantParam =
    typeof metadata?.assistant === 'object' &&
    metadata?.assistant !== null &&
    'parameters' in metadata.assistant
      ? (metadata.assistant as { parameters?: { stream?: boolean } }).parameters
          ?.stream === false
      : undefined

  if (nonStreamingAssistantParam) return

  return (
    <div className="flex items-center gap-1 text-main-view-fg/60 text-xs">
      <Gauge size={16} />
      <span>
        {streaming
          ? formatSpeed(streamingTokenSpeed)
          : formatSpeed(persistedTokenSpeed)}
        &nbsp;tokens/sec
      </span>
    </div>
  )
})

export default memo(TokenSpeedIndicator)
