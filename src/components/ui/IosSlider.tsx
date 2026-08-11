import { useRef, type ReactNode, type CSSProperties, type MouseEvent } from 'react'

export interface IosSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function IosSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  leftSlot,
  rightSlot,
  disabled = false,
  className = '',
  style,
}: IosSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = (clientX: number) => {
    if (disabled || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    if (rect.width <= 0) return

    const relativeX = clientX - rect.left
    const rawRatio = Math.max(0, Math.min(1, relativeX / rect.width))
    const rawVal = min + rawRatio * (max - min)

    // Apply step rounding
    const steppedVal = Math.round(rawVal / step) * step
    const clampedVal = Math.max(min, Math.min(max, steppedVal))

    onChange(clampedVal)
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (disabled) return
    updateFromClientX(e.clientX)

    const handleMouseMove = (ev: globalThis.MouseEvent) => {
      updateFromClientX(ev.clientX)
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Calculate percentage for rendering fill & knob
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100))

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...style,
      }}
    >
      {leftSlot && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#8e8e93', fontSize: '20px' }}>
          {leftSlot}
        </div>
      )}

      {/* Track bar container */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        style={{
          position: 'relative',
          flex: 1,
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Track background bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.24)',
          }}
        />

        {/* Fill blue bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${percentage}%`,
            height: '8px',
            borderRadius: '4px',
            background: '#0a84ff',
          }}
        />

        {/* Ticks dots */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            padding: '0 2px',
          }}
        >
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }} />
        </div>

        {/* Smooth White Pill Knob */}
        <div
          style={{
            position: 'absolute',
            left: `${percentage}%`,
            transform: 'translate(-50%, -50%)',
            top: '50%',
            width: '40px',
            height: '24px',
            borderRadius: '100px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {rightSlot && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#8e8e93', fontSize: '20px' }}>
          {rightSlot}
        </div>
      )}
    </div>
  )
}

export default IosSlider
