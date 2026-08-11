import { useEffect, useState } from 'react'
import { MDTCard } from './MDTCard'
import { MDTStatCard } from './MDTStatCard'
import { MDTGridContainer, MDTGridItem } from './MDTGridContainer'
import {
  getLlamadas,
  updateLlamadaEstado,
  updateLlamadaNotas,
  toggleUnidadLlamada,
  checkOfficerAccess,
} from '@/services/mdtService'
import { useTabletNotification } from '@/contexts/TabletNotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import type { LlamadaItem } from '@/types/mdt'
import styles from './MDTCallsTab.module.css'

export function MDTCallsTab() {
  const { sendNotification } = useTabletNotification()
  const { personaje } = useAuth()
  const activeDni = (personaje?.idnumber || personaje?.numero || '').trim()

  const [calls, setCalls] = useState<LlamadaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [officerBadge, setOfficerBadge] = useState<string>('Agente')
  const [editingNotes, setEditingNotes] = useState<Record<number, string>>({})

  useEffect(() => {
    if (activeDni) {
      checkOfficerAccess(activeDni, personaje?.nombre).then((officer) => {
        if (officer) {
          const badge = officer.placa ? `#${officer.placa} - ${officer.nombre_completo}` : officer.nombre_completo
          setOfficerBadge(badge)
        }
      })
    }

    loadCalls()

    const interval = setInterval(() => {
      loadCalls(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [activeDni, personaje])

  async function loadCalls(showSpinner = true) {
    if (showSpinner) setLoading(true)
    const data = await getLlamadas()
    setCalls(data)
    if (showSpinner) setLoading(false)
  }

  async function handleToggleStatus(callNumber: number, currentResolved: boolean) {
    const nextStatus = !currentResolved
    const ok = await updateLlamadaEstado(callNumber, nextStatus)
    if (ok) {
      setCalls((prev) =>
        prev.map((c) => (c.numero === callNumber ? { ...c, estado: nextStatus } : c))
      )
      sendNotification({
        titulo: nextStatus ? 'Llamada Resuelta' : 'Llamada Reabierta',
        texto: `Llamada #${callNumber} ${nextStatus ? 'marcada como resuelta' : 'reabierta en el sistema'}`,
        icono: nextStatus ? '' : '2',
        color: nextStatus ? '#30d158' : '#ebebebff',
      })
    }
  }

  async function handleSaveNotes(callNumber: number) {
    const noteText = editingNotes[callNumber]
    if (noteText === undefined) return

    const ok = await updateLlamadaNotas(callNumber, noteText)
    if (ok) {
      setCalls((prev) =>
        prev.map((c) => (c.numero === callNumber ? { ...c, notas: noteText } : c))
      )
      sendNotification({
        titulo: 'Notas Guardadas',
        texto: `Notas de intervención actualizadas para la llamada #${callNumber}`,
        icono: '📝',
        color: '#2997ff',
      })
    }
  }

  async function handleToggleAttach(callNumber: number) {
    const ok = await toggleUnidadLlamada(callNumber, officerBadge)
    if (ok) {
      setCalls((prev) =>
        prev.map((c) => {
          if (c.numero === callNumber) {
            const currentUnits: string[] = Array.isArray(c.unidades) ? c.unidades : []
            const exists = currentUnits.includes(officerBadge)
            const updatedUnits = exists
              ? currentUnits.filter((u) => u !== officerBadge)
              : [...currentUnits, officerBadge]
            return { ...c, unidades: updatedUnits }
          }
          return c
        })
      )
    }
  }

  // Filter & Search Logic
  const filteredCalls = calls.filter((c) => {
    if (filter === 'active' && c.estado === true) return false
    if (filter === 'resolved' && c.estado === false) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    const numStr = String(c.numero)
    const descStr = (c.descripcion || '').toLowerCase()
    const lugarStr = (c.lugar || '').toLowerCase()
    const teamStr = (c.equipo || '').toLowerCase()
    return numStr.includes(q) || descStr.includes(q) || lugarStr.includes(q) || teamStr.includes(q)
  })

  const activeCount = calls.filter((c) => !c.estado).length
  const resolvedCount = calls.filter((c) => c.estado).length
  const totalAssigned = calls.reduce((acc, c) => acc + (Array.isArray(c.unidades) ? c.unidades.length : 0), 0)

  return (
    <div className={styles.callsContainer}>
      {/* ─── RESUMEN SUPERIOR (MISMO LAYOUT QUE LA PANTALLA PRINCIPAL) ─── */}
      <MDTGridContainer>
        <MDTGridItem span={3}>
          <MDTStatCard
            title="Llamadas"
            value={activeCount > 0 ? `${activeCount} Activas` : 'Despejado'}
            trend=""
            trendType={activeCount > 0 ? 'negative' : 'positive'}
            icon=""
            iconColor={activeCount > 0 ? 'red' : 'blue'}
          />
        </MDTGridItem>
        <MDTGridItem span={3}>
          <MDTStatCard
            title="Resueltas"
            value={resolvedCount}
            trend="Archivadas"
            trendType="positive"
            icon=""
            iconColor="blue"
          />
        </MDTGridItem>
        <MDTGridItem span={3}>
          <MDTStatCard
            title="Desplegadas"
            value={`${totalAssigned}`}
            trend="Unidades"
            trendType="positive"
            icon="󱅧"
            iconColor="blue"
          />
        </MDTGridItem>
        <MDTGridItem span={3}>
          <MDTStatCard
            title="Mi Unidad"
            value={officerBadge}
            trend="Placa"
            trendType="positive"
            icon=""
            iconColor="blue"
          />
        </MDTGridItem>
      </MDTGridContainer>

      {/* ─── BARRA DE FILTROS Y BÚSQUEDA ───────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'active' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('active')}
          >
            Activas ({activeCount})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'resolved' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resueltas ({resolvedCount})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({calls.length})
          </button>
        </div>

        <div className={styles.searchBox}>
          <span></span>
          <input
            type="text"
            placeholder="Filtrar por N° llamada, delito o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ─── TARJETAS DE LLAMADAS ─────────────────────────────────── */}
      <MDTCard title="Despacho de LLamadas" subtitle="Sincronización cada 10 segundos">
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: '20px', textAlign: 'center' }}>
            Cargando llamadas...
          </div>
        ) : filteredCalls.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: '30px', textAlign: 'center' }}>
            No constan llamadas {filter === 'active' ? 'activas' : filter === 'resolved' ? 'resueltas' : ''} que coincidan con la búsqueda.
          </div>
        ) : (
          <div className={styles.callsGrid}>
            {filteredCalls.map((call) => {
              const isResolved = call.estado
              const units: string[] = Array.isArray(call.unidades) ? call.unidades : []
              const isAttached = units.includes(officerBadge)
              const coordsStr = Array.isArray(call.coordenadas) ? call.coordenadas.join(', ') : String(call.coordenadas || '')
              const currentNoteVal = editingNotes[call.numero] !== undefined ? editingNotes[call.numero] : (call.notas || '')

              return (
                <div
                  key={call.numero}
                  className={`${styles.callCard} ${isResolved ? styles.callCardResolved : styles.callCardActive}`}
                >
                  <div className={styles.callHeader}>
                    <div className={`${styles.callNumberBadge} ${isResolved ? styles.callNumberBadgeResolved : ''}`}>
                      <span>{isResolved ? '' : ''}</span>
                      <span>LLAMADA #{call.numero}</span>
                      <span style={{ fontSize: '10px', opacity: 0.8 }}>({call.equipo || 'Police'})</span>
                    </div>
                    <span className={styles.callMetaTime}>
                      <span></span> {call.hora || 'En curso'}
                    </span>
                  </div>

                  <div className={styles.callDescription}>
                    {call.descripcion || 'Incidente de emergencia'}
                  </div>

                  <div className={styles.callLocationBlock}>
                    <span className={styles.locationLabel}> Ubicación</span>
                    <span className={styles.locationText}>{call.lugar || 'Ubicación no especificada'}</span>
                    {coordsStr && <span className={styles.coordsBadge}>Coordenadas: [{coordsStr}], consulta el mapa para ubicar la llamada.</span>}
                  </div>

                  <div className={styles.unitsSection}>
                    <span className={styles.unitsLabel}>Unidades Asignadas ({units.length}):</span>
                    {units.length === 0 ? (
                      <span className={styles.noUnitsText}>Ninguna unidad asignada por el momento.</span>
                    ) : (
                      <div className={styles.unitsChipsList}>
                        {units.map((u, uIdx) => (
                          <span key={uIdx} className={styles.unitChip}>
                            󱅧 {u}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notas de intervención */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.unitsLabel}>Notas de Intervención:</span>
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(call.numero)}
                        className={styles.saveNotesBtn}
                      >
                        󰳻 Guardar Notas
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Escriba notas u observaciones del incidente..."
                      value={currentNoteVal}
                      onChange={(e) => setEditingNotes({ ...editingNotes, [call.numero]: e.target.value })}
                      className={styles.notesArea}
                    />
                  </div>

                  {/* Acciones Rápidas */}
                  <div className={styles.actionsRow}>
                    <button
                      type="button"
                      onClick={() => handleToggleAttach(call.numero)}
                      className={`${styles.attachBtn} ${isAttached ? styles.attachBtnActive : ''}`}
                    >
                      {isAttached ? ' Desasignarme' : ' Unirme a la llamada'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(call.numero, isResolved)}
                      className={`${styles.toggleStatusBtn} ${isResolved ? styles.toggleStatusBtnReopen : ''}`}
                    >
                      {isResolved ? ' Reabrir Llamada' : '󱥾 Marcar Resuelta'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </MDTCard>
    </div>
  )
}
