import {
  useTabletNotification,
  type TabletNotificationItem,
} from '@/contexts/TabletNotificationContext'
import styles from './TabletNotificationContainer.module.css'

function parseNotificationColor(colorStr: string): { bg: string; shadow: string } {
  const lower = (colorStr || '').toLowerCase().trim()
  if (
    lower === 'green' ||
    lower === 'verde' ||
    lower === 'exito' ||
    lower === 'success' ||
    lower === 'saved'
  ) {
    return { bg: '#30d158', shadow: 'rgba(48, 209, 88, 0.85)' }
  }
  if (
    lower === 'yellow' ||
    lower === 'amarillo' ||
    lower === 'warning' ||
    lower === 'advertencia'
  ) {
    return { bg: '#ff9f0a', shadow: 'rgba(255, 159, 10, 0.85)' }
  }
  if (
    lower === 'red' ||
    lower === 'rojo' ||
    lower === 'error' ||
    lower === 'danger'
  ) {
    return { bg: '#ff453a', shadow: 'rgba(255, 69, 58, 0.85)' }
  }
  if (lower === 'blue' || lower === 'azul' || lower === 'info') {
    return { bg: '#2997ff', shadow: 'rgba(41, 151, 255, 0.85)' }
  }
  if (lower === 'purple' || lower === 'morado') {
    return { bg: '#af52de', shadow: 'rgba(175, 82, 222, 0.85)' }
  }

  // Si es un color hex o rgba directo
  return { bg: colorStr, shadow: colorStr }
}

function TabletNotificationCard({ item }: { item: TabletNotificationItem }) {
  const { dismissNotification } = useTabletNotification()
  const { bg: colorBg, shadow: colorShadow } = parseNotificationColor(item.color)

  return (
    <div
      className={`${styles.notificationCard} ${
        item.isExiting ? styles.notificationCardExiting : ''
      }`}
      onClick={() => dismissNotification(item.id)}
      role="alert"
    >
      {/* Fondo con brillo ambiental sutil en el lado izquierdo */}
      <div
        className={styles.ambientGlow}
        style={{
          background: `radial-gradient(circle at left center, ${colorShadow}, transparent 80%)`,
        }}
      />

      {/* Círculo doble simple: detrás transparente (32px), delante sólido pequeñito (22px) con icono */}
      <div className={styles.iconWrapper}>
        <div
          className={styles.outerAura}
          style={{
            backgroundColor: colorBg,
          }}
        />

        <div
          className={styles.innerCircle}
          style={{
            backgroundColor: colorBg,
          }}
        >
          <span className={styles.iconText}>{item.icono}</span>
        </div>
      </div>

      {/* Contenido de texto: Título y Descripción */}
      <div className={styles.contentArea}>
        <h4 className={styles.title}>{item.titulo}</h4>
        <p className={styles.text}>{item.texto}</p>
      </div>

      {/* Barra de progreso inferior que retrocede según la duración */}
      <div className={styles.progressBarTrack}>
        <div
          className={styles.progressBarFill}
          style={{
            backgroundColor: colorBg,
            boxShadow: `0 0 8px ${colorShadow}`,
            animationDuration: `${item.duracion || 5000}ms`,
          }}
        />
      </div>
    </div>
  )
}

export function TabletNotificationContainer() {
  const { notifications } = useTabletNotification()

  if (notifications.length === 0) return null

  return (
    <div className={styles.notificationStack}>
      {notifications.map((item) => (
        <TabletNotificationCard key={item.id} item={item} />
      ))}
    </div>
  )
}
