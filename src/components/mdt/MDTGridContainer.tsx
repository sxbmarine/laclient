import React from 'react'
import styles from './MDTGridContainer.module.css'

interface MDTGridContainerProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function MDTGridContainer({ children, className = '', style }: MDTGridContainerProps) {
  return (
    <div className={`${styles.grid} ${className}`} style={style}>
      {children}
    </div>
  )
}

interface MDTGridItemProps {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function MDTGridItem({ span = 12, children, className = '', style }: MDTGridItemProps) {
  const spanClass = styles[`span${span}`] || styles.span12
  return (
    <div className={`${spanClass} ${className}`} style={style}>
      {children}
    </div>
  )
}
