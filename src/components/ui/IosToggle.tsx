import { type MouseEvent, type CSSProperties } from 'react'

export interface IosToggleProps {
  checked: boolean
  onChange: (nextChecked: boolean) => void
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

export function IosToggle({
  checked,
  onChange,
  disabled = false,
  className = '',
  style,
}: IosToggleProps) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(!checked)
  }

  return (
    <div
      onClick={handleClick}
      className={className}
      style={{
        width: '51px',
        height: '31px',
        borderRadius: '100px',
        backgroundColor: checked ? '#34c759' : 'rgba(120, 120, 128, 0.32)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-block',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <div
        style={{
          width: '27px',
          height: '27px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: '0px',
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.25), 0 1px 1px rgba(0, 0, 0, 0.12)',
        }}
      />
    </div>
  )
}

export default IosToggle
