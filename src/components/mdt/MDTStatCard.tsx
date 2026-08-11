import { MDTCard } from './MDTCard'
import styles from './MDTStatCard.module.css'

interface MDTStatCardProps {
  title: string
  value: string | number
  trend?: string
  trendType?: 'positive' | 'negative'
  icon: string
  iconColor?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
}

export function MDTStatCard({
  title,
  value,
  trend,
  trendType = 'positive',
  icon,
  iconColor = 'blue',
}: MDTStatCardProps) {
  const iconClass =
    iconColor === 'green'
      ? styles.iconGreen
      : iconColor === 'orange'
      ? styles.iconOrange
      : iconColor === 'red'
      ? styles.iconRed
      : iconColor === 'purple'
      ? styles.iconPurple
      : styles.iconBlue

  return (
    <MDTCard hoverable>
      <div className={styles.statCard}>
        <div className={styles.statMeta}>
          <span className={styles.statTitle}>{title}</span>
          <div className={styles.statValueGroup}>
            <span className={styles.statValue}>{value}</span>
            {trend && (
              <span
                className={`${styles.statTrend} ${
                  trendType === 'positive' ? styles.trendPositive : styles.trendNegative
                }`}
              >
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`${styles.iconWrapper} ${iconClass}`}>
          <span className={styles.iconInner}>{icon}</span>
        </div>
      </div>
    </MDTCard>
  )
}
