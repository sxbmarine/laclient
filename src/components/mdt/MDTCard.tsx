import React from 'react'
import styles from './MDTCard.module.css'

interface MDTCardProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  style?: React.CSSProperties
}

export function MDTCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  hoverable = false,
  style,
}: MDTCardProps) {
  return (
    <div
      className={`${styles.card} ${hoverable ? styles.cardHoverable : ''} ${className}`}
      style={style}
    >
      {(title || action) && (
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleGroup}>
            {title && <h3 className={styles.cardTitle}>{title}</h3>}
            {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
          </div>
          {action && <div className={styles.cardAction}>{action}</div>}
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  )
}
