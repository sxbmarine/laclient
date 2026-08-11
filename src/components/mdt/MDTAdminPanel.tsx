import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MDTCard } from './MDTCard'
import { MDTGridContainer, MDTGridItem } from './MDTGridContainer'
import { getPolicias, addPolicia, deletePolicia, updatePoliciaInfo, searchCiudadano } from '@/services/mdtService'
import { useTabletNotification } from '@/contexts/TabletNotificationContext'
import type { PoliciaItem } from '@/types/mdt'
import styles from './MDTAdminPanel.module.css'

export function MDTAdminPanel() {
  const { sendNotification } = useTabletNotification()
  const [officers, setOfficers] = useState<PoliciaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Form inputs for creating access
  const [dni, setDni] = useState<string>('')
  const [nombreCompleto, setNombreCompleto] = useState<string>('')
  const [departamento, setDepartamento] = useState<string>('LAPD')
  const [placa, setPlaca] = useState<string>('')
  const [rango, setRango] = useState<string>('Police Officer II')
  const [permisos, setPermisos] = useState<string>('oficial')

  // Edit Modal State
  const [editingOfficer, setEditingOfficer] = useState<PoliciaItem | null>(null)
  const [editPlaca, setEditPlaca] = useState<string>('')
  const [editRango, setEditRango] = useState<string>('Police Officer II')
  const [editDepartamento, setEditDepartamento] = useState<string>('LAPD')
  const [editPermiso, setEditPermiso] = useState<string>('oficial')

  // Autopoblar Nombre y Apellidos automáticamente al ingresar/buscar por DNI
  useEffect(() => {
    const cleanDni = dni.trim()
    if (!cleanDni || cleanDni.length < 2) return

    const timer = setTimeout(async () => {
      const citizen = await searchCiudadano(cleanDni)
      if (citizen && citizen.nombreCompleto) {
        setNombreCompleto(citizen.nombreCompleto)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [dni])

  const losAngelesAgencies = [
    { value: 'LAPD', label: 'LAPD — Los Angeles Police Dept.' },
    { value: 'LASD', label: "LASD — LA County Sheriff's Dept." },
    { value: 'CHP', label: 'CHP — California Highway Patrol' },
    { value: 'LAPD-Metro', label: 'LAPD — Metropolitan / SWAT' },
  ]

  const losAngelesRanks = [
    'Police Officer I',
    'Police Officer II',
    'Police Officer III',
    'Detective I',
    'Detective II',
    'Sergeant I',
    'Sergeant II',
    'Lieutenant',
    'Captain',
    'Commander',
    'Deputy Chief',
    'Chief of Police',
  ]

  useEffect(() => {
    loadOfficers()
  }, [])

  async function loadOfficers() {
    setLoading(true)
    const data = await getPolicias()
    setOfficers(data)
    setLoading(false)
  }

  async function handleCreateAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!dni || !nombreCompleto || !placa) {
      sendNotification({
        titulo: 'Datos Incompletos',
        texto: 'Por favor completa el DNI, Nombre y Placa del Agente.',
        icono: '!',
        color: '#ff9f0a',
      })
      return
    }

    const formattedPlaca = placa.startsWith('#') ? placa : `#${placa}`

    const newOfficer: Omit<PoliciaItem, 'id'> = {
      dni: dni.trim(),
      nombre_completo: nombreCompleto.trim(),
      placa: formattedPlaca,
      departamento,
      rango,
      permisos: permisos === 'admin' ? ['admin', 'chief'] : ['oficial'],
      estado: '10-8',
      llamada_activa: null,
    }

    const created = await addPolicia(newOfficer)
    if (created) {
      sendNotification({
        titulo: 'Acceso Otorgado',
        texto: `Acceso otorgado al agente ${nombreCompleto} (${formattedPlaca})`,
        icono: '',
        color: '#30d158',
      })
      setDni('')
      setNombreCompleto('')
      setPlaca('')
      setOfficers((prev) => [created, ...prev])
    } else {
      setOfficers((prev) => [newOfficer as PoliciaItem, ...prev])
      sendNotification({
        titulo: 'Acceso Registrado',
        texto: `Acceso creado localmente para ${nombreCompleto} (${formattedPlaca})`,
        icono: '',
        color: '#30d158',
      })
      setDni('')
      setNombreCompleto('')
      setPlaca('')
    }
  }

  function handleOpenEditModal(officer: PoliciaItem) {
    setEditingOfficer(officer)
    setEditPlaca(officer.placa || '')
    setEditRango(officer.rango || 'Police Officer II')
    setEditDepartamento(officer.departamento || 'LAPD')
    const hasAdmin = Array.isArray(officer.permisos)
      ? officer.permisos.includes('admin') || officer.permisos.includes('chief')
      : String(officer.permisos || '').includes('admin')
    setEditPermiso(hasAdmin ? 'admin' : 'oficial')
  }

  async function handleSaveEditOfficer(e: React.FormEvent) {
    e.preventDefault()
    if (!editingOfficer) return

    const formattedPlaca = editPlaca.startsWith('#') ? editPlaca : `#${editPlaca}`
    const updatedPerms = editPermiso === 'admin' ? ['admin', 'chief'] : ['oficial']

    const updates: Partial<PoliciaItem> = {
      placa: formattedPlaca,
      rango: editRango,
      departamento: editDepartamento,
      permisos: updatedPerms,
    }

    await updatePoliciaInfo(editingOfficer.dni, updates)

    setOfficers((prev) =>
      prev.map((o) =>
        o.dni === editingOfficer.dni ? { ...o, ...updates } : o
      )
    )

    sendNotification({
      titulo: 'Agente Actualizado',
      texto: `Datos del agente ${editingOfficer.nombre_completo} actualizados con éxito.`,
      icono: '',
      color: '#30d158',
    })

    setEditingOfficer(null)
  }

  async function handleDeleteOfficer(officerDni: string, name: string) {
    if (confirm(`¿Estás seguro de revocar el acceso al MDT del agente ${name}?`)) {
      await deletePolicia(officerDni)
      setOfficers((prev) => prev.filter((o) => o.dni !== officerDni))

      sendNotification({
        titulo: 'Acceso Revocado',
        texto: `Se ha revocado el acceso al MDT del agente ${name}.`,
        icono: '',
        color: '#ff453a',
      })
    }
  }

  return (
    <MDTGridContainer>
      {/* Formulario de Alta de Agentes */}
      <MDTGridItem span={4}>
        <MDTCard title="Crear Acceso a Agente" subtitle="Alta en Sistema Policial LAPD / LASD">
          <form onSubmit={handleCreateAccess} className={styles.adminForm}>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>DNI del Agente</label>
              <input
                type="text"
                placeholder="Ej: P1005 o 49201938X"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nombre y Apellidos (Auto por DNI)</label>
              <input
                type="text"
                placeholder="Ej: Carlos Mendez"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Agencia de Los Ángeles</label>
              <select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                className={styles.select}
              >
                {losAngelesAgencies.map((ag) => (
                  <option key={ag.value} value={ag.value}>
                    {ag.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Número de Placa</label>
              <input
                type="text"
                placeholder="Ej: #154"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Rango (Rango Oficial LAPD)</label>
              <select
                value={rango}
                onChange={(e) => setRango(e.target.value)}
                className={styles.select}
              >
                {losAngelesRanks.map((rk) => (
                  <option key={rk} value={rk}>
                    {rk}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nivel de Permiso</label>
              <select
                value={permisos}
                onChange={(e) => setPermisos(e.target.value)}
                className={styles.select}
              >
                <option value="oficial">Oficial (Acceso Estándar Consulta/Registros)</option>
                <option value="admin">Chief / Admin (Control Total + Administración)</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Otorgar Acceso
            </button>
          </form>
        </MDTCard>
      </MDTGridItem>

      {/* Lista / Directorio Completo de Agentes con Acceso */}
      <MDTGridItem span={8}>
        <MDTCard
          title="Directorio de Agentes con Acceso"
          subtitle={`${officers.length} Agentes Registrados`}
        >
          {loading ? (
            <div style={{ padding: '20px', color: 'rgba(255,255,255,0.6)' }}>Cargando agentes...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Agencia</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>DNI</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Nombre del Agente</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Placa</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Rango</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((officer) => {
                    const isDeptLASD = officer.departamento === 'LASD'
                    const isDeptCHP = officer.departamento === 'CHP'
                    const isDeptMetro = officer.departamento === 'LAPD-Metro'

                    return (
                      <tr key={officer.dni} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              background: isDeptLASD
                                ? 'rgba(255, 159, 10, 0.25)'
                                : isDeptCHP
                                  ? 'rgba(48, 209, 88, 0.25)'
                                  : isDeptMetro
                                    ? 'rgba(175, 82, 222, 0.25)'
                                    : 'rgba(0, 102, 204, 0.25)',
                              color: isDeptLASD
                                ? '#ff9f0a'
                                : isDeptCHP
                                  ? '#30d158'
                                  : isDeptMetro
                                    ? '#bf5af2'
                                    : '#2997ff',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontWeight: 800,
                              fontSize: '10px',
                            }}
                          >
                            {officer.departamento || 'LAPD'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{officer.dni}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, color: '#fff' }}>{officer.nombre_completo}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 800, color: '#2997ff' }}>{officer.placa}</td>
                        <td style={{ padding: '10px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{officer.rango || 'Police Officer II'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(officer)}
                            style={{
                              background: 'rgba(41, 151, 255, 0.2)',
                              color: '#2997ff',
                              border: '1px solid rgba(41, 151, 255, 0.4)',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                             Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOfficer(officer.dni, officer.nombre_completo)}
                            className={styles.deleteBtn}
                          >
                            Revocar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </MDTCard>
      </MDTGridItem>

      {/* Modal Formulario para Editar Placa, Rango y Permisos de Agente */}
      {editingOfficer &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                background: '#121620',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '16px',
                padding: '24px',
                width: '100%',
                maxWidth: '450px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-display)' }}>
                ✏️ Modificar Agente: {editingOfficer.nombre_completo}
              </h3>
              <form onSubmit={handleSaveEditOfficer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>DNI del Agente (Fijo)</label>
                  <input type="text" value={editingOfficer.dni} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Número de Placa</label>
                  <input
                    type="text"
                    value={editPlaca}
                    onChange={(e) => setEditPlaca(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Agencia / Departamento</label>
                  <select
                    value={editDepartamento}
                    onChange={(e) => setEditDepartamento(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {losAngelesAgencies.map((ag) => (
                      <option key={ag.value} value={ag.value}>{ag.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Rango (Estructura LAPD / LASD)</label>
                  <select
                    value={editRango}
                    onChange={(e) => setEditRango(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    {losAngelesRanks.map((rk) => (
                      <option key={rk} value={rk}>{rk}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Permisos del MDT</label>
                  <select
                    value={editPermiso}
                    onChange={(e) => setEditPermiso(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                  >
                    <option value="oficial">Oficial (Acceso Estándar Consulta/Registros)</option>
                    <option value="admin">Chief / Admin (Control Total + Administración)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingOfficer(null)}
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#30d158', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('mdt-tablet-screen-root') || document.body
        )}
    </MDTGridContainer>
  )
}
