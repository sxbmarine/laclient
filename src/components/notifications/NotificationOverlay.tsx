import { useState } from 'react'
import { useNotification } from '@/contexts/NotificationContext'
import NotificationCollapsed from './NotificationCollapsed'

export function NotificationOverlay() {
  const { notifications, dismiss } = useNotification()
  const [exitingId, setExitingId] = useState<string | null>(null)

  if (!notifications || notifications.length === 0) return null

  const active = notifications[0]
  const isExiting = exitingId === active.id
  const stackCount = Math.min(3, notifications.length)
  const stackProp = String(stackCount)

  const handleClick = () => {
    if (exitingId) return
    setExitingId(active.id)
    if (active.onClick) {
      active.onClick()
    }
    setTimeout(() => {
      dismiss(active.id)
      setExitingId(null)
    }, 300)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100px',
        left: '12px',
        right: '12px',
        zIndex: 999,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'auto',
        animation: isExiting
          ? 'notificationSlideUp 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'notificationSlideDown 0.42s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }}
    >
      <NotificationCollapsed
        text_135_0={active.title}
        text_135_4={active.message}
        app={active.app}
        iconUrl={active.iconUrl}
        timeText={active.timeText || 'Ahora'}
        Stack={stackProp}
        onClick={handleClick}
      />
    </div>
  )
}

export default NotificationOverlay
