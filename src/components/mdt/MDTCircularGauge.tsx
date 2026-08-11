import { MDTCard } from './MDTCard'
import styles from './MDTCircularGauge.module.css'

interface MDTCircularGaugeProps {
  title: string
  subtitle?: string
  percentage: number
  label?: string
}

export function MDTCircularGauge({
  title,
  subtitle,
  percentage,
  label = 'Completado',
}: MDTCircularGaugeProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <MDTCard title={title} subtitle={subtitle}>
      <div className={styles.gaugeContainer}>
        <svg className={styles.svgGauge} viewBox="0 0 140 140">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066cc" />
              <stop offset="100%" stopColor="#2997ff" />
            </linearGradient>
          </defs>
          <circle className={styles.gaugeBg} cx="70" cy="70" r={radius} />
          <circle
            className={styles.gaugeFill}
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className={styles.gaugeTextGroup}>
          <span className={styles.gaugePercent}>{percentage}%</span>
          <span className={styles.gaugeLabel}>{label}</span>
        </div>
      </div>
    </MDTCard>
  )
}
