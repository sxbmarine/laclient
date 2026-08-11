import styles from './StatusBar.module.css'

interface StatusBarProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  light?: boolean
}

export function StatusBar({
  showBack,
  onBack,
  light = false,
}: StatusBarProps) {
  const now = new Date()
  const time = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`${styles.bar} ${light ? styles.light : ''}`}>
      <div className={styles.time}>{time}</div>
      <div className={styles.center}>
        {showBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ‹ Atrás
          </button>
        )}
      </div>
      <div className={styles.right}>
        <div className={styles.icons}>
          <span><img src="/src/assets/icons/cellularbars.svg" alt="Cellular" /></span>
          <span><img src="/src/assets/icons/wifi.svg" alt="WiFi" /></span>
          <span><img src="/src/assets/icons/battery.svg" alt="Battery" /></span>
        </div>
      </div>
    </div>
  )
}
