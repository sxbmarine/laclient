import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MDTCard } from './MDTCard'
import { getBuscados, addBuscado, deleteBuscado, checkOfficerAccess, searchCiudadano } from '@/services/mdtService'
import { useTabletNotification } from '@/contexts/TabletNotificationContext'
import { useAuth } from '@/contexts/AuthContext'
import { getRobloxAvatarUrl, getRobloxHeadshotDirectUrl } from '@/lib/roblox'
import type { BuscadoItem } from '@/types/mdt'
import styles from './MDTWantedCard.module.css'

interface MDTWantedCardProps {
  onCreated?: () => void
}

function RobloxMugshot({ nombre, dni, fotoUrl, className }: { nombre: string; dni: string; fotoUrl?: string; className?: string }) {
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [robloxUsername, setRobloxUsername] = useState<string>('')

  useEffect(() => {
    if (fotoUrl && !fotoUrl.includes('unsplash.com')) {
      setAvatarUrl(fotoUrl)
      return
    }

    let isMounted = true
    const query = (dni || nombre || '').trim()

    if (!query) return

    // Buscar en la tabla personajes para obtener el usuario_roblox real del sujeto
    searchCiudadano(query).then((cit) => {
      if (!isMounted) return
      const realRobloxUser = (cit?.robloxUser || cit?.nombreCompleto || nombre || dni || '')
        .replace(/^@/, '')
        .replace(/\s+/g, '')
        .trim()

      setRobloxUsername(realRobloxUser)
      const directUrl = getRobloxHeadshotDirectUrl(realRobloxUser || 'Roblox')
      setAvatarUrl(directUrl)

      getRobloxAvatarUrl(realRobloxUser).then((url) => {
        if (isMounted && url) {
          setAvatarUrl(url)
        }
      })
    })

    return () => {
      isMounted = false
    }
  }, [nombre, dni, fotoUrl])

  return (
    <img
      src={avatarUrl || getRobloxHeadshotDirectUrl(robloxUsername || nombre || 'Roblox')}
      alt={nombre}
      className={className}
      onError={(e) => {
        const el = e.currentTarget
        const fallback = getRobloxHeadshotDirectUrl(robloxUsername || nombre || 'Roblox')
        if (el.src !== fallback) {
          el.src = fallback
        } else {
          el.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        }
      }}
    />
  )
}

export function MDTWantedCard({ onCreated }: MDTWantedCardProps) {
  const { sendNotification } = useTabletNotification()
  const { personaje } = useAuth()
  const activeDni = (personaje?.idnumber || personaje?.numero || '').trim()

  const [subjects, setSubjects] = useState<BuscadoItem[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)

  // Form states
  const [dni, setDni] = useState<string>('')
  const [nombre, setNombre] = useState<string>('')
  const [motivo, setMotivo] = useState<string>('')
  const [agente, setAgente] = useState<string>('')
  const [peligrosidad, setPeligrosidad] = useState<string>('ALTA')
  const [fotoUrl, setFotoUrl] = useState<string>('')

  useEffect(() => {
    loadBuscados()

    // Autopoblar el nombre/placa del agente en base a su DNI autenticado
    if (activeDni) {
      checkOfficerAccess(activeDni, personaje?.nombre).then((access) => {
        if (access?.nombre_completo) {
          const badgeLabel = access.placa ? `#${access.placa} - ${access.nombre_completo}` : access.nombre_completo
          setAgente(badgeLabel)
        } else if (personaje?.nombre) {
          setAgente(personaje.nombre)
        }
      })
    }
  }, [activeDni, personaje])

  async function loadBuscados() {
    const data = await getBuscados()
    setSubjects(data)
  }

  async function handleEmitWarrant(e: React.FormEvent) {
    e.preventDefault()
    if (!dni || !nombre || !motivo) {
      alert('Por favor completa el DNI, Nombre del Sujeto y el Motivo.')
      return
    }

    const newItem: Omit<BuscadoItem, 'id'> = {
      dni: dni.trim().toUpperCase(),
      nombre_sujeto: nombre.trim(),
      motivo: motivo.trim(),
      agente_dni: agente,
      nivel_peligrosidad: peligrosidad,
      foto_url: fotoUrl.trim() || '',
      estado: 'ACTIVO',
      fecha: new Date().toISOString(),
    }

    const created = await addBuscado(newItem)
    if (created) {
      setSubjects((prev) => [created, ...prev])
    } else {
      setSubjects((prev) => [newItem as BuscadoItem, ...prev])
    }

    sendNotification({
      titulo: 'Orden BOLO Emitida',
      texto: `Orden de búsqueda emitida para ${nombre.trim()} (${peligrosidad})`,
      icono: '',
      color: '#ff453a',
    })

    setShowModal(false)
    setDni('')
    setNombre('')
    setMotivo('')
    setFotoUrl('')
    if (onCreated) onCreated()
  }

  async function handleDeleteBolo(item: BuscadoItem) {
    if (confirm(`¿Retirar orden BOLO de ${item.nombre_sujeto}?`)) {
      const key = item.id ? String(item.id) : item.dni
      await deleteBuscado(key)
      setSubjects((prev) => prev.filter((s) => (s.id ? String(s.id) : s.dni) !== key))

      sendNotification({
        titulo: 'BOLO Retirado',
        texto: `Se ha retirado la orden de búsqueda de ${item.nombre_sujeto}.`,
        icono: '',
        color: '#ff453a',
      })
    }
  }

  return (
    <MDTCard
      title="Buscados / BOLO"
      subtitle={`${subjects.length} Órdenes Activas`}
      action={
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 69, 58, 0.25)',
            color: '#ff453a',
            border: '1px solid rgba(255, 69, 58, 0.4)',
            padding: '4px 10px',
            borderRadius: '12px',
            fontFamily: 'var(--font-family-system)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span></span>
          <span>Nuevo BOLO</span>
        </button>
      }
    >
      {subjects.length === 0 ? (
        <div style={{ padding: '20px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
          No constan órdenes BOLO o de busca y captura activas.
        </div>
      ) : (
        <div className={styles.bulletinGrid}>
          {subjects.map((item) => (
            <div key={item.id || item.dni} className={styles.bulletinCard}>
              <RobloxMugshot
                nombre={item.nombre_sujeto}
                dni={item.dni}
                fotoUrl={item.foto_url || undefined}
                className={styles.mugshot}
              />
              <div className={styles.bulletinBody}>
                <div className={styles.bulletinHeader}>
                  <span className={styles.subjectName}>{item.nombre_sujeto}</span>
                  <div className={styles.alertTagGroup}>
                    <span className={styles.alertTag}>{item.nivel_peligrosidad || 'BUSCADO'}</span>
                    <button
                      type="button"
                      className={styles.deleteBoloBtn}
                      onClick={() => handleDeleteBolo(item)}
                      title="Retirar BOLO"
                    >
                      
                    </button>
                  </div>
                </div>
                <span className={styles.crimeDetail}>{item.motivo}</span>
                <div className={styles.metaRow}>
                  <span>DNI: {item.dni}</span>
                  <span>{item.agente_dni}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Formulario para Emitir BOLO / WANTED */}
      {showModal &&
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
                maxWidth: '440px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-display)' }}>
                Emitir Orden de Búsqueda y Captura (WANTED)
              </h3>
              <form onSubmit={handleEmitWarrant} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    DNI del Sujeto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 49201938X"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Nombre y Apellidos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Elena Rostova"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Motivo de la Orden / Delito
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describa la infracción o motivo de captura..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                      Peligrosidad
                    </label>
                    <select
                      value={peligrosidad}
                      onChange={(e) => setPeligrosidad(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(20,25,35,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                    >
                      <option value="ALTA">ALTA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="BAJA">BAJA</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                      Agente Registrador
                    </label>
                    <input
                      type="text"
                      value={agente || 'Cargando agente...'}
                      readOnly
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'not-allowed',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    URL de Imagen (Ficha Mugshot)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ background: '#ff453a', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Publicar Orden BOLO
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.getElementById('mdt-tablet-screen-root') || document.body
        )}
    </MDTCard>
  )
}
