import { useEffect, useState } from 'react'
import { MDTCard } from './MDTCard'
import { getPolicias } from '@/services/mdtService'
import type { PoliciaItem } from '@/types/mdt'
import styles from './MDTPersonnelRoster.module.css'

interface MDTPersonnelRosterProps {
  title?: string
  subtitle?: string
  showOnlyActive?: boolean
  compact?: boolean
  onStatusChange?: (status: string) => void
}

export function MDTPersonnelRoster({
  title = 'Directorio General de Policía',
  showOnlyActive = false,
  compact = false,
  onStatusChange: _onStatusChange,
}: MDTPersonnelRosterProps) {
  const [officers, setOfficers] = useState<PoliciaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadRoster()
  }, [])

  async function loadRoster() {
    setLoading(true)
    const data = await getPolicias()
    setOfficers(data)
    setLoading(false)
  }

  // Se consideran unidades activas TODAS excepto las que están en '10-7' (Fuera de Servicio)
  const activeCount = officers.filter((o) => o.estado !== '10-7').length
  const displayedOfficers = showOnlyActive
    ? officers.filter((o) => o.estado !== '10-7')
    : officers

  return (
    <MDTCard
      title={title}
      action={
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 800,
            color: activeCount > 0 ? '#30d158' : '#8e8e93',
            background: activeCount > 0 ? 'rgba(48, 209, 88, 0.2)' : 'rgba(142, 142, 147, 0.2)',
            padding: '2px 8px',
            borderRadius: '12px',
            border: activeCount > 0 ? '1px solid rgba(48, 209, 88, 0.3)' : '1px solid rgba(142, 142, 147, 0.3)',
          }}
        >
          Dispo. {activeCount} Unidades
        </span>
      }
    >
      <div className={`${styles.rosterList} ${compact ? styles.compactList : ''} app-scroll`}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: '10px' }}>Cargando directorio de policía...</div>
        ) : displayedOfficers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: '14px', textAlign: 'center' }}>
            No constan oficiales registrados en la base de datos de policía.
          </div>
        ) : (
          displayedOfficers.map((officer) => {
            const deptClass =
              officer.departamento === 'LASD'
                ? styles.deptSDSO
                : officer.departamento === 'CHP'
                  ? styles.deptSASP
                  : officer.departamento === 'LAPD-Metro'
                    ? styles.deptSAHP
                    : styles.deptLSPD

            const dotColor =
              officer.estado === '10-8'
                ? '#30d158'
                : officer.estado === '10-97'
                  ? '#ff9f0a'
                  : officer.estado === '10-23'
                    ? '#2997ff'
                    : officer.estado === 'codigo3'
                      ? '#ff453a'
                      : '#8e8e93'

            return (
              <div key={officer.dni} className={styles.officerRow}>
                <span className={`${styles.deptBadge} ${deptClass}`}>{officer.departamento || 'LAPD'}</span>
                <div className={styles.officerMeta}>
                  <div className={styles.officerHeader}>
                    <span
                      className={styles.statusDot}
                      style={{
                        backgroundColor: dotColor,
                        boxShadow: `0 0 8px ${dotColor}`,
                      }}
                    />
                    <span className={styles.officerName}>{officer.nombre_completo}</span>
                  </div>
                  <span className={styles.officerSub}>
                    Placa {officer.placa} • {officer.rango || 'Police Officer II'} • Status: {officer.estado || '10-8'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </MDTCard>
  )
}
