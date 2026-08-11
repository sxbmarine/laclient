import { useEffect, useState } from 'react'
import { MDTCard } from './MDTCard'
import { supabase } from '@/lib/supabase'
import styles from './MDTDataTable.module.css'

export interface LogEntry {
  id: string
  personName: string
  date: string
  reason: string
  officer: string
}

interface MDTDataTableProps {
  title?: string
  subtitle?: string
  entries?: LogEntry[]
}

export function MDTDataTable({
  title = 'Últimas Notas y Atestados',
  subtitle = 'Historial Reciente de Patrulla',
  entries: initialEntries,
}: MDTDataTableProps) {
  const [liveEntries, setLiveEntries] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      setLiveEntries(initialEntries)
      setLoading(false)
      return
    }

    loadRecentAntecedentes()
  }, [initialEntries])

  async function loadRecentAntecedentes() {
    try {
      const { data, error } = await supabase
        .from('antecedentes')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(6)

      if (error || !data || data.length === 0) {
        setLiveEntries([
          {
            id: 'ant-1',
            personName: 'Elena Rostova (49201938X)',
            date: new Date().toLocaleDateString('es-ES'),
            reason: 'Art. 102 — DUI / Conducción Bajo Efectos',
            officer: '#209 - Kaya Taskiran',
          },
          {
            id: 'ant-2',
            personName: 'Marcus Vance (91823712Y)',
            date: new Date(Date.now() - 86400000).toLocaleDateString('es-ES'),
            reason: 'Art. 101 — Atentado a la Autoridad',
            officer: '#104 - David Garcia',
          },
        ])
      } else {
        const mapped: LogEntry[] = data.map((item: any) => ({
          id: item.id,
          personName: item.dni,
          date: item.fecha ? new Date(item.fecha).toLocaleString('es-ES') : 'Reciente',
          reason: Array.isArray(item.cargos_aplicados)
            ? item.cargos_aplicados
                .map((c: any) => (typeof c === 'number' ? `Art. ${c}` : c))
                .join(', ')
            : item.cargos_aplicados || item.detalles || 'Atentado / Infracción',
          officer: item.agente_dni || 'Oficial de Patrulla',
        }))
        setLiveEntries(mapped)
      }
    } catch (e) {
      console.error('Error cargando tabla de antecedentes:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MDTCard title={title} subtitle={subtitle}>
      <div className={`${styles.tableWrapper} app-scroll`}>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', padding: '10px' }}>Cargando atestados...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Implicado / DNI</th>
                <th>Fecha y Hora</th>
                <th>Motivo / Cargo</th>
                <th>Oficial Registrador</th>
              </tr>
            </thead>
            <tbody>
              {liveEntries.map((item) => (
                <tr key={item.id}>
                  <td className={styles.nameCell}>{item.personName}</td>
                  <td>{item.date}</td>
                  <td>{item.reason}</td>
                  <td className={styles.officerCell}>{item.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MDTCard>
  )
}
