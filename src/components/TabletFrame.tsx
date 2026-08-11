import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDevice } from '@/contexts/DeviceContext'
import { useAuth } from '@/contexts/AuthContext'
import tabletFrameImg from '@/assets/frames/tablet.png'
import tabletBg from '@/assets/backgrounds/tablet/background1.jpg'
import logoCalifornia from '@/assets/tablet/california-full.png'
import { MDTGridContainer, MDTGridItem } from '@/components/mdt/MDTGridContainer'
import { MDTCard } from '@/components/mdt/MDTCard'
import { MDTStatCard } from '@/components/mdt/MDTStatCard'
import { MDTCircularGauge } from '@/components/mdt/MDTCircularGauge'
import { MDTMapCard } from '@/components/mdt/MDTMapCard'
import { MDTPersonnelRoster } from '@/components/mdt/MDTPersonnelRoster'
import { MDTWantedCard } from '@/components/mdt/MDTWantedCard'
import { MDTDataTable } from '@/components/mdt/MDTDataTable'
import { MDTAdminPanel } from '@/components/mdt/MDTAdminPanel'
import { MDTFullMapTab } from '@/components/mdt/MDTFullMapTab'
import { MDTCallsTab } from '@/components/mdt/MDTCallsTab'
import { TabletNotificationContainer } from '@/components/notifications/TabletNotificationContainer'
import { useTabletNotification } from '@/contexts/TabletNotificationContext'
import {
  getCodigoPenal,
  getAntecedentesByDNI,
  addAntecedente,
  searchCiudadano,
  searchVehiculo,
  getInformes,
  addInforme,
  updatePoliciaEstado,
  checkOfficerAccess,
  type CiudadanoProfile,
  type VehiculoProfile,
} from '@/services/mdtService'
import type { CodigoPenalItem, AntecedenteItem, InformeItem, PoliciaItem } from '@/types/mdt'
import { getRobloxAvatarUrl, getRobloxHeadshotDirectUrl } from '@/lib/roblox'
import styles from './TabletFrame.module.css'

export function TabletFrame() {
  const [scale, setScale] = useState(1)
  const [isFocused, setIsFocused] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('inicio')
  const { openPhone } = useDevice()
  const { personaje } = useAuth()

  // DNI Activo del personaje autenticado
  const activeDni = (personaje?.idnumber || personaje?.numero || '').trim()

  // ─── Control de Autorización y Permisos ────────────────────────
  const [officerAccess, setOfficerAccess] = useState<PoliciaItem | null>(null)
  const [isAccessChecked, setIsAccessChecked] = useState<boolean>(false)
  const [robloxAvatarUrl, setRobloxAvatarUrl] = useState<string>('')

  const cleanRobloxUser = (personaje?.usuario_roblox || '').replace(/^@/, '').replace(/\s+/g, '').trim()

  useEffect(() => {
    const username = cleanRobloxUser || 'Roblox'
    const initialUrl = getRobloxHeadshotDirectUrl(username)
    setRobloxAvatarUrl(initialUrl)

    let isMounted = true
    getRobloxAvatarUrl(username).then((url) => {
      if (isMounted && url) {
        setRobloxAvatarUrl(url)
      }
    })

    return () => {
      isMounted = false
    }
  }, [cleanRobloxUser])

  // ─── Real Live States ──────────────────────────────────────────
  const [penalArticles, setPenalArticles] = useState<CodigoPenalItem[]>([])
  const [penalCategoryFilter, setPenalCategoryFilter] = useState<string>('TODOS')
  const [penalSearchQuery, setPenalSearchQuery] = useState<string>('')

  // Servicio State
  const [myDutyStatus, setMyDutyStatus] = useState<string>('10-8')

  // Ciudadanos Search & Record State
  const [citizenQuery, setCitizenQuery] = useState<string>('')
  const [citizenProfile, setCitizenProfile] = useState<CiudadanoProfile | null>(null)
  const [citizenAvatarUrl, setCitizenAvatarUrl] = useState<string>('')
  const [citizenRecords, setCitizenRecords] = useState<AntecedenteItem[]>([])
  const [citizenSearchPerformed, setCitizenSearchPerformed] = useState<boolean>(false)
  const [showAddRecordModal, setShowAddRecordModal] = useState<boolean>(false)
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])
  const [recordDetails, setRecordDetails] = useState<string>('')
  const [recordOfficer, setRecordOfficer] = useState<string>('')
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('')
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('TODOS')

  useEffect(() => {
    if (!citizenProfile) {
      setCitizenAvatarUrl('')
      return
    }

    const cleanUser = (citizenProfile.robloxUser || citizenProfile.nombreCompleto || '')
      .replace(/^@/, '')
      .replace(/\s+/g, '')
      .trim()

    const initialUrl = getRobloxHeadshotDirectUrl(cleanUser || 'Roblox')
    setCitizenAvatarUrl(initialUrl)

    let isMounted = true
    getRobloxAvatarUrl(cleanUser).then((url) => {
      if (isMounted && url) {
        setCitizenAvatarUrl(url)
      }
    })

    return () => {
      isMounted = false
    }
  }, [citizenProfile])

  // Vehículos State
  const [plateQuery, setPlateQuery] = useState<string>('')
  const [vehicleProfile, setVehicleProfile] = useState<VehiculoProfile | null>(null)
  const [vehicleSearchPerformed, setVehicleSearchPerformed] = useState<boolean>(false)

  // Informes State
  const [informesList, setInformesList] = useState<InformeItem[]>([])
  const [reportTitle, setReportTitle] = useState<string>('')
  const [reportOfficer, setReportOfficer] = useState<string>('')
  const [reportInvolved, setReportInvolved] = useState<string>('')
  const [reportDesc, setReportDesc] = useState<string>('')

  // Verificar estrictamente si tiene permisos de 'chief' o 'admin' en el campo permisos
  const hasAdminPermission = (() => {
    if (!officerAccess) return false
    const perms = officerAccess.permisos

    if (Array.isArray(perms)) {
      return perms.some(
        (p) => String(p).toLowerCase() === 'admin' || String(p).toLowerCase() === 'chief'
      )
    }

    if (typeof perms === 'string') {
      const lower = perms.toLowerCase()
      return lower.includes('admin') || lower.includes('chief')
    }

    return false
  })()

  // Navegación lateral dinámica
  const baseNavItems = [
    { id: 'inicio', label: 'Inicio', icon: '' },
    { id: 'servicio', label: 'Servicio', icon: '' },
    { id: 'mapa', label: 'Mapa', icon: '' },
    { id: 'llamadas', label: 'Llamadas', icon: '' },
    { id: 'ciudadanos', label: 'Ciudadanos', icon: '' },
    { id: 'vehiculos', label: 'Vehículos', icon: '' },
    { id: 'policia', label: 'Policía', icon: '󱅧' },
    { id: 'codigos-radio', label: 'Códigos Radiales', icon: '󰐺' },
    { id: 'codigo-penal', label: 'Código Penal', icon: '' },
    { id: 'buscados', label: 'Buscados', icon: '' },
    { id: 'informes', label: 'Informes', icon: '󱧶' },
    { id: 'documentos', label: 'Documentos', icon: '' },
    { id: 'movil', label: 'Volver al Móvil', icon: '' },
  ]

  const navItems = hasAdminPermission
    ? [...baseNavItems, { id: 'admin', label: 'Administración', icon: '' }]
    : baseNavItems

  // Si se pierde el permiso de admin, cambiar automáticamente la pestaña activa a 'inicio'
  useEffect(() => {
    if (isAccessChecked && !hasAdminPermission && activeTab === 'admin') {
      setActiveTab('inicio')
    }
  }, [isAccessChecked, hasAdminPermission, activeTab])

  useEffect(() => {
    function updateScale() {
      const targetWidth = 1100
      const targetHeight = 780
      const scaleX = (window.innerWidth - 24) / targetWidth
      const scaleY = (window.innerHeight - 24) / targetHeight
      const s = Math.min(scaleX, scaleY)
      setScale(s)
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    const onFocus = () => setIsFocused(true)
    const onBlur = () => setIsFocused(false)
    const onMouseEnter = () => setIsFocused(true)

    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    window.addEventListener('mouseenter', onMouseEnter)

    // Verify Police Officer Access in Supabase
    verifyAccess()

    // Load initial Live Data
    loadInitialData()

    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('mouseenter', onMouseEnter)
    }
  }, [activeDni])

  async function verifyAccess() {
    setIsAccessChecked(false)
    const officer = await checkOfficerAccess(activeDni, personaje?.nombre)
    setOfficerAccess(officer)
    setIsAccessChecked(true)
    if (officer) {
      const badgeName = `${officer.placa || ''} - ${officer.nombre_completo || ''}`.trim()
      setReportOfficer(badgeName)
      setRecordOfficer(badgeName)
      setMyDutyStatus(officer.estado || '10-8')
    }
  }

  async function loadInitialData() {
    const articles = await getCodigoPenal()
    setPenalArticles(articles)

    const reports = await getInformes()
    setInformesList(reports)
  }

  // ─── Citizen Search & Record Handler ───────────────────────────
  async function handleSearchCitizen(q: string) {
    if (!q || !q.trim()) return
    setCitizenSearchPerformed(true)
    const profile = await searchCiudadano(q)
    setCitizenProfile(profile)
    if (profile) {
      const records = await getAntecedentesByDNI(profile.dni)
      setCitizenRecords(records)
    } else {
      setCitizenRecords([])
    }
  }

  async function handleAddAntecedenteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!citizenProfile || selectedArticles.length === 0) {
      alert('Por favor selecciona al menos un artículo o sanción del Código Penal.')
      return
    }

    const chosen = penalArticles.filter((a) => selectedArticles.includes(a.id))
    const totalMulta = chosen.reduce((acc, curr) => acc + Number(curr.dinero || 0), 0)
    const totalTiempo = chosen.reduce((acc, curr) => acc + Number(curr.tiempo || 0), 0)

    // Determinar si SOLO son delitos de tráfico
    const isOnlyTraffic =
      chosen.length > 0 &&
      chosen.every((art) => {
        const cat = (art.categoria || '').toLowerCase()
        const cls = (art.clase || '').toLowerCase()
        const name = (art.nombre || '').toLowerCase()
        return (
          cat.includes('tránsito') ||
          cat.includes('transito') ||
          cat.includes('tráfico') ||
          cat.includes('trafico') ||
          cat.includes('traffic') ||
          cls.includes('tránsito') ||
          cls.includes('transito') ||
          cls.includes('traffic') ||
          name.includes('tránsito') ||
          name.includes('tráfico') ||
          name.includes('velocidad') ||
          name.includes('dui')
        )
      })

    const recordType: 'traffic' | 'criminal' = isOnlyTraffic ? 'traffic' : 'criminal'

    // Si incluye cárcel (>0 min), saltar confirmación a modo de recordatorio
    if (totalTiempo > 0) {
      const confirmJail = window.confirm(
        `⚠️ RECORDATORIO DE DETENCIÓN Y CÁRCEL:\n\n` +
        `El ciudadano ${citizenProfile.nombreCompleto} (${citizenProfile.dni}) acumula una pena de ${totalTiempo} MINUTOS DE CÁRCEL y una multa de $${totalMulta.toLocaleString()}.\n\n` +
        `¿Deseas confirmar la detención e inscribir este antecedente penal?`
      )
      if (!confirmJail) return
    }

    // Se registrarán los cargos POR NUMERO en la base de datos como array de IDs (ej. [101, 102])
    const cargosNumeros = chosen.map((c) => Number(c.id))

    const newRecord: Omit<AntecedenteItem, 'id'> = {
      dni: citizenProfile.dni,
      cargos_aplicados: cargosNumeros,
      fecha: new Date().toISOString(),
      agente_dni: recordOfficer || officerAccess?.nombre_completo || 'Oficial LAPD',
      multa_total: totalMulta,
      tiempo_total: totalTiempo,
      tipo: recordType,
      detalles: recordDetails
        ? `[Tipo: ${recordType.toUpperCase()}] ${recordDetails}`
        : `[Tipo: ${recordType.toUpperCase()}] Citación y registro de intervención policial.`,
    }

    const created = await addAntecedente(newRecord)
    if (created) {
      setCitizenRecords((prev) => [created, ...prev])
    } else {
      setCitizenRecords((prev) => [newRecord as AntecedenteItem, ...prev])
    }

    setShowAddRecordModal(false)
    setSelectedArticles([])
    setRecordDetails('')
    setModalSearchQuery('')
    setModalCategoryFilter('TODOS')

    sendNotification({
      titulo: `Antecedente ${recordType === 'traffic' ? 'Tráfico' : 'Criminal'} Registrado`,
      texto: `Multa: $${totalMulta.toLocaleString()} ${totalTiempo > 0 ? `| Cárcel: ${totalTiempo} min` : ''}`,
      icono: recordType === 'traffic' ? '󰔫' : '󱅧',
      color: recordType === 'traffic' ? '#30d158' : '#ff453a',
    })
  }

  const renderAddRecordModal = () => {
    if (!showAddRecordModal) return null

    const filteredModalArticles = penalArticles.filter((art) => {
      const matchesCat = modalCategoryFilter === 'TODOS' || art.categoria === modalCategoryFilter
      const q = modalSearchQuery.toLowerCase().trim()
      const matchesQuery =
        !q ||
        art.nombre.toLowerCase().includes(q) ||
        (art.descripcion && art.descripcion.toLowerCase().includes(q)) ||
        (art.categoria && art.categoria.toLowerCase().includes(q)) ||
        (art.clase && art.clase.toLowerCase().includes(q)) ||
        String(art.id).includes(q)

      return matchesCat && matchesQuery
    })

    const modalChosenArticles = penalArticles.filter((a) => selectedArticles.includes(a.id))
    const modalTotalMulta = modalChosenArticles.reduce((acc, curr) => acc + Number(curr.dinero || 0), 0)
    const modalTotalTiempo = modalChosenArticles.reduce((acc, curr) => acc + Number(curr.tiempo || 0), 0)

    const modalIsOnlyTraffic =
      modalChosenArticles.length > 0 &&
      modalChosenArticles.every((art) => {
        const cat = (art.categoria || '').toLowerCase()
        const cls = (art.clase || '').toLowerCase()
        const name = (art.nombre || '').toLowerCase()
        return (
          cat.includes('tránsito') ||
          cat.includes('transito') ||
          cat.includes('tráfico') ||
          cat.includes('trafico') ||
          cat.includes('traffic') ||
          cls.includes('tránsito') ||
          cls.includes('transito') ||
          cls.includes('traffic') ||
          name.includes('tránsito') ||
          name.includes('tráfico') ||
          name.includes('velocidad') ||
          name.includes('dui')
        )
      })

    return createPortal(
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 99,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
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
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
          }}
          className="app-scroll"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'var(--font-display)', color: '#ffffff' }}>
                Registrar Antecedente Penal / Tráfico
              </h3>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Sujeto: <strong>{citizenProfile?.nombreCompleto}</strong> ({citizenProfile?.dni})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRecordModal(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAddAntecedenteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Seccion 1: Buscador e Infracciones del Código Penal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🔍 Buscador de Cargos del Código Penal:
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Buscar delito por número (§101), nombre, palabra clave o categoría (ej: Tránsito, DUI)..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtro rápido por Categoría */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }} className="app-scroll">
                {['TODOS', 'Tránsito', 'Delitos Graves', 'Armas', 'Propiedad', 'Orden Público', 'Sustancias Controladas'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setModalCategoryFilter(cat)}
                    style={{
                      background: modalCategoryFilter === cat ? '#0066cc' : 'rgba(255,255,255,0.06)',
                      color: modalCategoryFilter === cat ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      border: modalCategoryFilter === cat ? '1px solid #2997ff' : '1px solid rgba(255,255,255,0.1)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Lista Scrollable de Artículos Filtrados */}
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.35)',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                className="app-scroll"
              >
                {filteredModalArticles.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '12px' }}>
                    No se encontraron artículos con el filtro "{modalSearchQuery || modalCategoryFilter}".
                  </div>
                ) : (
                  filteredModalArticles.map((art) => {
                    const isChecked = selectedArticles.includes(art.id)
                    return (
                      <div
                        key={art.id}
                        onClick={() => {
                          if (isChecked) setSelectedArticles(selectedArticles.filter((i) => i !== art.id))
                          else setSelectedArticles([...selectedArticles, art.id])
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(41, 151, 255, 0.18)' : 'rgba(255,255,255,0.03)',
                          border: isChecked ? '1px solid #2997ff' : '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => { }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#2997ff', minWidth: '40px' }}>
                            §{art.id}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {art.nombre}
                            </span>
                            {art.descripcion && (
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#30d158' }}>
                            ${Number(art.dinero).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11px', color: Number(art.tiempo) > 0 ? '#ff9f0a' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                            {Number(art.tiempo) > 0 ? `${art.tiempo} min` : 'Sin cárcel'}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Ficha Resumen de Cargos Seleccionados y Tipo (Traffic vs Criminal) */}
            {modalChosenArticles.length > 0 && (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                    Cargos Seleccionados ({modalChosenArticles.length}):
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: modalIsOnlyTraffic ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                      color: modalIsOnlyTraffic ? '#30d158' : '#ff453a',
                      border: modalIsOnlyTraffic ? '1px solid rgba(48, 209, 88, 0.4)' : '1px solid rgba(255, 69, 58, 0.4)',
                    }}
                  >
                    {modalIsOnlyTraffic ? '🚘 TIPO: TRAFFIC' : '🚨 TIPO: CRIMINAL'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {modalChosenArticles.map((art) => (
                    <span
                      key={art.id}
                      style={{
                        background: 'rgba(41, 151, 255, 0.15)',
                        border: '1px solid rgba(41, 151, 255, 0.3)',
                        color: '#ffffff',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <strong>§{art.id}</strong> {art.nombre}
                      <button
                        type="button"
                        onClick={() => setSelectedArticles(selectedArticles.filter((i) => i !== art.id))}
                        style={{ background: 'none', border: 'none', color: '#ff453a', cursor: 'pointer', padding: 0, fontSize: '11px' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.85)', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span><strong>Cargos por número (Array):</strong> [{modalChosenArticles.map((a) => a.id).join(', ')}]</span>
                  <span><strong>Multa Acumulada:</strong> <span style={{ color: '#30d158', fontWeight: 800 }}>${modalTotalMulta.toLocaleString()}</span></span>
                  <span><strong>Cárcel Acumulada:</strong> <span style={{ color: modalTotalTiempo > 0 ? '#ff9f0a' : '#fff', fontWeight: 800 }}>{modalTotalTiempo} min</span></span>
                </div>
              </div>
            )}

            {/* Seccion 2: Campo Detalles y observaciones del encuentro */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detalles y observaciones del encuentro:
              </label>
              <textarea
                rows={3}
                placeholder="Escriba aquí los detalles u observaciones del encuentro/intervención policial..."
                value={recordDetails}
                onChange={(e) => setRecordDetails(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  marginTop: '4px',
                }}
              />
            </div>

            {/* Seccion 3: Agente Registrador */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                Agente Registrador (Auto por DNI):
              </label>
              <input
                type="text"
                value={recordOfficer || (officerAccess ? `${officerAccess.placa ? '#' + officerAccess.placa + ' - ' : ''}${officerAccess.nombre_completo}` : 'Agente en Servicio')}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '13px',
                  marginTop: '4px',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  background: modalIsOnlyTraffic ? '#30d158' : '#0066cc',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '13px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                }}
              >
                Guardar e Inscribir Antecedente
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.getElementById('mdt-tablet-screen-root') || document.body
    )
  }

  // ─── Vehicle Search Handler ────────────────────────────────────
  async function handleSearchVehicle(p: string) {
    if (!p || !p.trim()) return
    setVehicleSearchPerformed(true)
    const v = await searchVehiculo(p)
    setVehicleProfile(v)
  }

  // ─── Report Creation Handler ───────────────────────────────────
  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportTitle || !reportDesc) {
      alert('Por favor completa el título y la descripción del atestado.')
      return
    }

    const newReport: Omit<InformeItem, 'id'> = {
      titulo: reportTitle,
      agente: reportOfficer || officerAccess?.nombre_completo || 'Oficial LAPD',
      implicados: reportInvolved ? [reportInvolved] : [],
      descripcion: reportDesc,
      estado: 'ABIERTO',
      fecha: new Date().toISOString(),
    }

    const created = await addInforme(newReport)
    if (created) {
      setInformesList((prev) => [created, ...prev])
    } else {
      setInformesList((prev) => [newReport as InformeItem, ...prev])
    }

    setReportTitle('')
    setReportInvolved('')
    setReportDesc('')
    alert('Informe guardado y registrado en Supabase con éxito.')
  }

  const { sendNotification } = useTabletNotification()

  // ─── Duty Status Switcher ──────────────────────────────────────
  async function handleChangeDuty(status: string) {
    setMyDutyStatus(status)
    if (officerAccess) {
      await updatePoliciaEstado(officerAccess.dni, status)
    }

    if (status === '10-8') {
      sendNotification({
        titulo: '10-8 En Servicio',
        texto: 'Has cambiado tu estado a Disponible / En Servicio',
        icono: '',
        color: '#30d158',
      })
    } else if (status === '10-97') {
      sendNotification({
        titulo: '10-97 En Camino',
        texto: 'Has cambiado tu estado a En Camino / Respondiendo',
        icono: '',
        color: '#ff9f0a',
      })
    } else if (status === '10-23') {
      sendNotification({
        titulo: '10-23 En Escena',
        texto: 'Has cambiado tu estado a En Escena / En Ubicación',
        icono: '',
        color: '#2997ff',
      })
    } else if (status === 'codigo3') {
      sendNotification({
        titulo: 'Código 3 Emergencia',
        texto: 'Has activado la alerta de Emergencia Código 3',
        icono: '',
        color: '#ff453a',
      })
    } else if (status === '10-7') {
      sendNotification({
        titulo: '10-7 Fuera de Servicio',
        texto: 'Has cambiado tu estado a Fuera de Servicio',
        icono: '',
        color: '#8e8e93',
      })
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <MDTGridContainer>
            <MDTGridItem span={3}>
              <MDTStatCard title="Patrullas Activas" value="1" trend="CAD" trendType="positive" icon="" iconColor="blue" />
            </MDTGridItem>
            <MDTGridItem span={3}>
              <MDTStatCard title="Llamadas" value="0" trend="En Vivo" trendType="positive" icon="" iconColor="blue" />
            </MDTGridItem>
            <MDTGridItem span={3}>
              <MDTStatCard title="Atestados Registrados" value={`${informesList.length} Reportes`} trend="NCIC" trendType="positive" icon="󰈙" iconColor="blue" />
            </MDTGridItem>
            <MDTGridItem span={3}>
              <MDTStatCard title="Alertas BOLO" value="Ordenes Activas" icon="" iconColor="blue" />
            </MDTGridItem>

            <MDTGridItem span={8}>
              <MDTMapCard />
            </MDTGridItem>
            <MDTGridItem span={4}>
              <MDTPersonnelRoster compact={true} onStatusChange={(st) => setMyDutyStatus(st)} />
            </MDTGridItem>

            <MDTGridItem span={6}>
              <MDTWantedCard />
            </MDTGridItem>
            <MDTGridItem span={6}>
              <MDTDataTable />
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'servicio':
        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTCard title="Estado Operativo de la Patrulla" subtitle={`Oficial ${officerAccess?.nombre_completo || 'Activo'} (${officerAccess?.placa || '#209'}) — Estado: ${myDutyStatus}`}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleChangeDuty('10-8')}
                    style={{
                      background: myDutyStatus === '10-8' ? '#30d158' : 'rgba(48, 209, 88, 0.2)',
                      color: '#fff',
                      border: '1px solid #30d158',
                      padding: '12px 22px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: myDutyStatus === '10-8' ? '0 0 14px rgba(48, 209, 88, 0.6)' : 'none',
                    }}
                  >
                    <span style={{ marginRight: '6px' }}></span> EN SERVICIO (10-8)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDuty('10-97')}
                    style={{
                      background: myDutyStatus === '10-97' ? '#ff9f0a' : 'rgba(255, 159, 10, 0.2)',
                      color: '#fff',
                      border: '1px solid #ff9f0a',
                      padding: '12px 22px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: myDutyStatus === '10-97' ? '0 0 14px rgba(255, 159, 10, 0.6)' : 'none',
                    }}
                  >
                    <span style={{ marginRight: '6px' }}></span> EN CAMINO (10-97)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDuty('10-23')}
                    style={{
                      background: myDutyStatus === '10-23' ? '#2997ff' : 'rgba(41, 151, 255, 0.2)',
                      color: '#fff',
                      border: '1px solid #2997ff',
                      padding: '12px 22px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: myDutyStatus === '10-23' ? '0 0 14px rgba(41, 151, 255, 0.6)' : 'none',
                    }}
                  >
                    <span style={{ marginRight: '6px' }}></span> EN ESCENA (10-23)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDuty('codigo3')}
                    style={{
                      background: myDutyStatus === 'codigo3' ? '#ff453a' : 'rgba(255, 69, 58, 0.2)',
                      color: '#fff',
                      border: '1px solid #ff453a',
                      padding: '12px 22px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: myDutyStatus === 'codigo3' ? '0 0 14px rgba(255, 69, 58, 0.6)' : 'none',
                    }}
                  >
                    <span style={{ marginRight: '6px' }}></span> CÓDIGO 3 (EMERGENCIA)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeDuty('10-7')}
                    style={{
                      background: myDutyStatus === '10-7' ? '#8e8e93' : 'rgba(142, 142, 147, 0.2)',
                      color: '#fff',
                      border: '1px solid #8e8e93',
                      padding: '12px 22px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ marginRight: '6px' }}></span> FUERA DE SERVICIO (10-7)
                  </button>
                </div>
              </MDTCard>
            </MDTGridItem>
            <MDTGridItem span={8}>
              <MDTCard title="Detalles del servicio" subtitle="Despacho de Patrullas">
                <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span><strong>Oficial Conectado:</strong> {officerAccess?.nombre_completo}</span>
                  <span><strong>Agencia de Adscripción:</strong> {officerAccess?.departamento || 'Contactar con Administración'}</span>
                  <span><strong>Rango Asignado:</strong> {officerAccess?.rango || 'Contactar con Administración'}</span>
                  <span><strong>Frecuencia Radio:</strong> No disponible</span>
                  <span><strong>Estado reportado:</strong> {officerAccess?.estado}</span>
                  <span><strong>Unidad:</strong> {officerAccess?.placa}</span>
                </div>
              </MDTCard>
            </MDTGridItem>
            <MDTGridItem span={4}>
              <MDTCircularGauge title="Disponibilidad Canal Radio" percentage={92} label="Frecuencia Tac-1" />
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'mapa':
        return <MDTFullMapTab />

      case 'ciudadanos':
        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTCard title="Buscador NCIC de Ciudadanos" subtitle="Consulta de Identidad en Tiempo Real">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ingrese DNI o Nombre Completo del Ciudadano..."
                    value={citizenQuery}
                    onChange={(e) => setCitizenQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchCitizen(citizenQuery)}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchCitizen(citizenQuery)}
                    style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '0 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Buscar NCIC
                  </button>
                </div>
              </MDTCard>
            </MDTGridItem>

            {citizenSearchPerformed && !citizenProfile && (
              <MDTGridItem span={12}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  🔍 No constan registros de ciudadania en Supabase para la consulta "{citizenQuery}".
                </div>
              </MDTGridItem>
            )}

            {citizenProfile && (
              <>
                <MDTGridItem span={4}>
                  <MDTCard title="Perfil de Ciudadano">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                      {(() => {
                        const cleanUser = (citizenProfile.robloxUser || citizenProfile.nombreCompleto || '')
                          .replace(/^@/, '')
                          .replace(/\s+/g, '')
                          .trim()
                        const avatarSrc =
                          citizenAvatarUrl ||
                          citizenProfile.avatarUrl ||
                          getRobloxHeadshotDirectUrl(cleanUser || 'Roblox')

                        return (
                          <img
                            src={avatarSrc}
                            alt={citizenProfile.nombreCompleto}
                            onError={(e) => {
                              const el = e.currentTarget
                              const fallback = getRobloxHeadshotDirectUrl(cleanUser || 'Roblox')
                              if (el.src !== fallback) {
                                el.src = fallback
                              } else {
                                el.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                              }
                            }}
                            style={{ width: '90px', height: '90px', borderRadius: '50%', border: '2px solid #2997ff', objectFit: 'cover' }}
                          />
                        )
                      })()}
                      <div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>{citizenProfile.nombreCompleto}</h3>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>DNI: {citizenProfile.dni}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={{ background: citizenProfile.licenciaConducir ? 'rgba(48, 209, 88, 0.25)' : 'rgba(255, 69, 58, 0.25)', color: citizenProfile.licenciaConducir ? '#30d158' : '#ff453a', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: '1px solid transparent' }}>
                          {citizenProfile.licenciaConducir ? '🟢 LIC. CONDUCIR' : '🔴 SIN LICENCIA'}
                        </span>
                        <span style={{ background: citizenProfile.licenciaArmas ? 'rgba(255, 159, 10, 0.25)' : 'rgba(142, 142, 147, 0.25)', color: citizenProfile.licenciaArmas ? '#ff9f0a' : '#8e8e93', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, border: '1px solid transparent' }}>
                          {citizenProfile.licenciaArmas ? '🟡 LIC. ARMAS (CCW)' : '⚪ SIN ARMAS'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddRecordModal(true)}
                        style={{ background: 'linear-gradient(135deg, #0066cc, #2997ff)', color: '#fff', border: 'none', width: '100%', padding: '10px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}
                      >
                        Registrar Antecedente
                      </button>
                    </div>
                  </MDTCard>
                </MDTGridItem>

                <MDTGridItem span={8}>
                  <MDTCard title="Antecedentes Penal & Citaciones Registradas" subtitle={`${citizenRecords.length} Entradas`}>
                    {citizenRecords.length === 0 ? (
                      <div style={{ padding: '20px', color: 'rgba(255,255,255,0.6)' }}>No constan antecedentes registrados para este DNI en Supabase.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {citizenRecords.map((r, idx) => {
                          const isTraffic = r.tipo === 'traffic' || String(r.detalles).includes('[Tipo: TRAFFIC]')

                          // Descodificar lista de cargos: número en azul a la izquierda, nombre a la derecha
                          const rawCargos = Array.isArray(r.cargos_aplicados) ? r.cargos_aplicados : [r.cargos_aplicados]
                          const cargosList = rawCargos.filter(Boolean).map((item: any) => {
                            if (typeof item === 'number' || (!isNaN(Number(item)) && typeof item !== 'boolean')) {
                              const artId = Number(item)
                              const foundArt = penalArticles.find((a) => Number(a.id) === artId)
                              return {
                                num: `§${artId}`,
                                name: foundArt ? foundArt.nombre : `Cargo #${artId}`,
                              }
                            }

                            const strItem = String(item).trim()
                            const match = strItem.match(/^(?:Art\.\s*|§\s*)?(\d+)[\s—:-]*(.*)$/i)
                            if (match && match[1]) {
                              return {
                                num: `§${match[1]}`,
                                name: match[2].trim() || strItem,
                              }
                            }

                            const foundByName = penalArticles.find((a) => a.nombre.toLowerCase() === strItem.toLowerCase())
                            if (foundByName) {
                              return {
                                num: `§${foundByName.id}`,
                                name: foundByName.nombre,
                              }
                            }

                            return {
                              num: '§',
                              name: strItem,
                            }
                          })

                          return (
                            <div key={r.id || idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                              {/* Cabecera del antecedente con tipo y fecha */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Antecedente #{citizenRecords.length - idx}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '10px',
                                      background: isTraffic ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                                      color: isTraffic ? '#30d158' : '#ff453a',
                                      border: isTraffic ? '1px solid rgba(48, 209, 88, 0.4)' : '1px solid rgba(255, 69, 58, 0.4)',
                                    }}
                                  >
                                    {isTraffic ? '󰔫 TRÁFICO' : '󱅧 CRIMINAL'}
                                  </span>
                                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                                    {r.fecha ? new Date(r.fecha).toLocaleDateString('es-ES') : 'Reciente'}
                                  </span>
                                </div>
                              </div>

                              {/* Lista de Cargos: Número en azul a la izquierda, Nombre a la derecha */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0 10px 0' }}>
                                {cargosList.map((charge, cIdx) => (
                                  <div
                                    key={cIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      background: 'rgba(0, 0, 0, 0.25)',
                                      border: '1px solid rgba(255, 255, 255, 0.06)',
                                      borderRadius: '8px',
                                      padding: '6px 10px',
                                    }}
                                  >
                                    {/* Número en Azul a la izquierda */}
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: '#2997ff',
                                        background: 'rgba(41, 151, 255, 0.15)',
                                        border: '1px solid rgba(41, 151, 255, 0.3)',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        minWidth: '45px',
                                        textAlign: 'center',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {charge.num}
                                    </span>

                                    {/* Nombre a la derecha */}
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', flex: 1 }}>
                                      {charge.name}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Observaciones / Detalles */}
                              {r.detalles && (
                                <p style={{ margin: '4px 0 8px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                                  <strong>Observaciones:</strong> {String(r.detalles).replace(/^\[Tipo:\s*(TRAFFIC|CRIMINAL)\]\s*/i, '')}
                                </p>
                              )}

                              {/* Pie de registro */}
                              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                                <span><strong>Multa Total:</strong> <span style={{ color: '#30d158', fontWeight: 700 }}>${Number(r.multa_total || 0).toLocaleString()}</span></span>
                                <span><strong>Condena:</strong> <span style={{ color: Number(r.tiempo_total || 0) > 0 ? '#ff9f0a' : 'inherit', fontWeight: 700 }}>{r.tiempo_total || 0} min</span></span>
                                <span><strong>Agente:</strong> {r.agente_dni}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </MDTCard>
                </MDTGridItem>
              </>
            )}

            {/* Modal para Registrar Nuevo Antecedente */}
            {renderAddRecordModal()}
          </MDTGridContainer>
        )

      case 'vehiculos':
        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTCard title="Consulta Registro DGT de Vehículos" subtitle="Búsqueda por Matrícula">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ingrese Matrícula del Vehículo..."
                    value={plateQuery}
                    onChange={(e) => setPlateQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchVehicle(plateQuery)}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchVehicle(plateQuery)}
                    style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '0 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Buscar DGT
                  </button>
                </div>
              </MDTCard>
            </MDTGridItem>

            {vehicleSearchPerformed && !vehicleProfile && (
              <MDTGridItem span={12}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                  🚘 No consta ningún vehículo registrado en Supabase con la matrícula "{plateQuery}".
                </div>
              </MDTGridItem>
            )}

            {vehicleProfile && (
              <>
                <MDTGridItem span={4}>
                  <MDTCard title="Ficha Técnica del Vehículo">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ background: '#f4d068', color: '#000', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 800, fontSize: '20px', letterSpacing: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {vehicleProfile.patente}
                      </div>
                      <span style={{ color: '#fff' }}><strong>Modelo:</strong> {vehicleProfile.modelo}</span>
                      <span style={{ color: '#fff' }}><strong>Propietario:</strong> {vehicleProfile.propietarioNombre} ({vehicleProfile.propietarioDni})</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <span style={{ color: vehicleProfile.itv ? '#30d158' : '#ff453a', fontWeight: 700, fontSize: '12px' }}>
                          {vehicleProfile.itv ? '🟢 ITV EN REGLA' : '🔴 ITV CADUCADA'}
                        </span>
                        <span style={{ color: vehicleProfile.seguro ? '#30d158' : '#ff453a', fontWeight: 700, fontSize: '12px' }}>
                          {vehicleProfile.seguro ? '🟢 SEGURO VIGENTE' : '🔴 SIN SEGURO'}
                        </span>
                      </div>
                    </div>
                  </MDTCard>
                </MDTGridItem>

                <MDTGridItem span={8}>
                  <MDTDataTable title="Historial de Infractor del Vehículo" subtitle="Multas de Tráfico Asociadas" />
                </MDTGridItem>
              </>
            )}
          </MDTGridContainer>
        )

      case 'policia':
        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTPersonnelRoster />
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'movil':
        openPhone()
        return null

      case 'codigos-radio': {
        const radioCodeSections = [
          {
            title: '🔵 COMUNICACIÓN',
            color: '#2997ff',
            codes: [
              { code: '10-0', desc: 'Precaución' },
              { code: '10-1', desc: 'Mala señal' },
              { code: '10-2', desc: 'Buena señal' },
              { code: '10-3', desc: 'Alto / Deje de transmitir' },
              { code: '10-4', desc: 'Entendido / Recibido' },
              { code: '10-6', desc: 'Ocupado' },
              { code: '10-7', desc: 'Fuera de servicio' },
              { code: '10-8', desc: 'En servicio / Disponible' },
              { code: '10-9', desc: 'Repetir mensaje' },
              { code: '10-10', desc: 'Negativo' },
              { code: '10-12', desc: 'Personas presentes / Stand by' },
              { code: '10-17', desc: 'En ruta' },
              { code: '10-19', desc: 'Retornar a base' },
              { code: '10-20', desc: 'Ubicación' },
              { code: '10-22', desc: 'Cancelar / Ignorar' },
              { code: '10-23', desc: 'En escena' },
              { code: '10-26', desc: 'Cancelar última información' },
              { code: '10-27', desc: 'Cambiar de canal' },
            ],
          },
          {
            title: '🚦 TRÁFICO',
            color: '#30d158',
            codes: [
              { code: '10-11', desc: 'Parada de tráfico' },
              { code: '10-37', desc: 'Solicitar grúa' },
              { code: '10-38', desc: 'Solicitar ambulancia' },
              { code: '10-42', desc: 'Accidente de tránsito' },
              { code: '10-50', desc: 'Accidente grave' },
              { code: '10-53', desc: 'Carretera cerrada' },
              { code: '10-55', desc: 'Conductor ebrio / intoxicado' },
            ],
          },
          {
            title: '🚨 INCIDENTES',
            color: '#ff453a',
            codes: [
              { code: '10-14', desc: 'Persona en estado de ebriedad' },
              { code: '10-15', desc: 'Disturbio' },
              { code: '10-18', desc: 'Urgente / Prioridad' },
              { code: '10-30', desc: 'Uso indebido de radio' },
              { code: '10-31', desc: 'Delito en progreso' },
              { code: '10-32', desc: 'Sujeto armado' },
              { code: '10-33', desc: 'Emergencia / Ayuda inmediata' },
              { code: '10-35', desc: 'Sujeto peligroso' },
              { code: '10-64', desc: 'Secuestro / Persona retenida' },
              { code: '10-65', desc: 'Persona desaparecida' },
              { code: '10-67', desc: 'Persona sospechosa' },
            ],
          },
          {
            title: '🏃 PERSECUCIONES',
            color: '#ff9f0a',
            codes: [
              { code: '10-80', desc: 'Persecución vehicular' },
              { code: '10-81', desc: 'Persecución a pie' },
              { code: '10-83', desc: 'Persecución finalizada' },
              { code: '10-85', desc: 'Vehículo evadiendo control' },
              { code: '10-86', desc: 'Sujeto huyendo' },
            ],
          },
          {
            title: '🔫 ARMAS Y ROBOS',
            color: '#bf5af2',
            codes: [
              { code: '10-71', desc: 'Disparos reportados' },
              { code: '10-77', desc: 'Persona armada' },
              { code: '10-90', desc: 'Alarma / Robo en progreso' },
              { code: '10-91', desc: 'Vehículo robado' },
            ],
          },
          {
            title: '⚠️ CLAVES ESPECIALES',
            color: '#ffd60a',
            codes: [
              { code: 'Modo Charlie', desc: 'Silencio en la radio.' },
              { code: 'QRR', desc: 'Oficial en peligro inminente.' },
              { code: 'Código PIT', desc: 'Maniobra para detener / desestabilizar un vehículo.' },
              { code: 'Clave ROBERT', desc: 'Autorización para inutilizar neumáticos mediante disparo o pinchos.' },
            ],
          },
        ]

        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTCard title="Códigos Radiales y claves tácticas">
                <div
                  style={{
                    columns: '320px 2',
                    columnGap: '16px',
                  }}
                >
                  {radioCodeSections.map((sec, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        breakInside: 'avoid',
                        marginBottom: '16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: 800,
                          color: sec.color,
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.5px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          paddingBottom: '8px',
                        }}
                      >
                        {sec.title}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sec.codes.map((item, cIdx) => (
                          <div
                            key={cIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(0, 0, 0, 0.25)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '12px',
                            }}
                          >
                            <span
                              style={{
                                color: sec.color,
                                fontWeight: 800,
                                fontFamily: 'var(--font-display)',
                                background: 'rgba(255,255,255,0.06)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                minWidth: '85px',
                                textAlign: 'center',
                              }}
                            >
                              {item.code}
                            </span>
                            <span style={{ color: '#ffffff', fontWeight: 600, flex: 1, marginLeft: '10px' }}>
                              {item.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </MDTCard>
            </MDTGridItem>
          </MDTGridContainer>
        )
      }

      case 'buscados':
        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTWantedCard />
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'informes':
        return (
          <MDTGridContainer>
            <MDTGridItem span={5}>
              <MDTCard title="Redactar Informe Policial" subtitle="Nuevo Atestado">
                <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#fff' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Título del Atestado</label>
                    <input type="text" placeholder="Ej: Incautación de Armamento..." value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Agente Redactor (Auto por DNI)</label>
                    <input
                      type="text"
                      value={reportOfficer || (officerAccess ? `${officerAccess.placa ? '#' + officerAccess.placa + ' - ' : ''}${officerAccess.nombre_completo}` : 'Agente en Servicio')}
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
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Implicados (DNI / Nombre)</label>
                    <input type="text" placeholder="Ej: Elena Rostova (49201938X)" value={reportInvolved} onChange={(e) => setReportInvolved(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Descripción de los Hechos</label>
                    <textarea rows={4} placeholder="Escriba los hechos detalladamente..." value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', outline: 'none' }} required />
                  </div>
                  <button type="submit" style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Guardar e Inscribir Atestado</button>
                </form>
              </MDTCard>
            </MDTGridItem>
            <MDTGridItem span={7}>
              <MDTCard title="Archivo de Informes Registrados" subtitle={`${informesList.length} Reportes`}>
                {informesList.length === 0 ? (
                  <div style={{ padding: '20px', color: 'rgba(255,255,255,0.6)' }}>No constan informes policiales registrados en la base de datos Supabase.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {informesList.map((inf) => (
                      <div key={inf.id || inf.titulo} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{inf.titulo}</span>
                          <span style={{ background: 'rgba(48, 209, 88, 0.2)', color: '#30d158', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 800 }}>{inf.estado || 'REGISTRADO'}</span>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{inf.descripcion}</p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                          <span><strong>Agente:</strong> {inf.agente}</span>
                          <span><strong>Fecha:</strong> {inf.fecha ? new Date(inf.fecha).toLocaleDateString('es-ES') : 'Hoy'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </MDTCard>
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'codigo-penal': {
        const categories = [
          'TODOS',
          'Orden Público',
          'Personas',
          'Propiedad',
          'Armas',
          'Sustancias Controladas',
          'Delitos Económicos',
          'Administración Pública',
          'Tránsito',
          'Servicios de Emergencia',
          'Terrorismo y Crimen Organizado',
          'Delitos Federales y Mayores',
        ]

        const filteredArticles = penalArticles.filter((art) => {
          const matchesCat = penalCategoryFilter === 'TODOS' || art.categoria === penalCategoryFilter
          const q = penalSearchQuery.toLowerCase().trim()
          const matchesQuery =
            !q ||
            art.nombre.toLowerCase().includes(q) ||
            (art.descripcion && art.descripcion.toLowerCase().includes(q)) ||
            (art.categoria && art.categoria.toLowerCase().includes(q)) ||
            (art.clase && art.clase.toLowerCase().includes(q)) ||
            String(art.id).includes(q)

          return matchesCat && matchesQuery
        })

        return (
          <MDTGridContainer>
            <MDTGridItem span={12}>
              <MDTCard
                title="Código Penal Oficial de Los Ángeles"
                subtitle={`${filteredArticles.length} de ${penalArticles.length} Artículos Registrados`}
              >
                {/* Buscador Integrado y Filtros */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar por artículo (§201), delito, palabras clave o clase (Felony, Misdemeanor)..."
                      value={penalSearchQuery}
                      onChange={(e) => setPenalSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {penalSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPenalSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.6)',
                          cursor: 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Categorías de Navegación */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPenalCategoryFilter(cat)}
                        style={{
                          background: penalCategoryFilter === cat ? '#0066cc' : 'rgba(255,255,255,0.06)',
                          color: penalCategoryFilter === cat ? '#fff' : 'rgba(255,255,255,0.7)',
                          border: '1px solid ' + (penalCategoryFilter === cat ? '#0066cc' : 'rgba(255,255,255,0.1)'),
                          padding: '5px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Artículos */}
                {filteredArticles.length === 0 ? (
                  <div style={{ padding: '30px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                    🔍 No constan artículos en el Código Penal que coincidan con la búsqueda "{penalSearchQuery || penalCategoryFilter}".
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {filteredArticles.map((art) => {
                      const isFelony = art.clase?.toLowerCase() === 'felony'
                      const isMisd = art.clase?.toLowerCase() === 'misdemeanor'
                      const isInf = art.clase?.toLowerCase() === 'infraction'
                      const isAgrav = art.clase?.toLowerCase() === 'agravante'

                      const classBadgeBg = isFelony
                        ? 'rgba(255, 69, 58, 0.2)'
                        : isMisd
                          ? 'rgba(255, 159, 10, 0.2)'
                          : isInf
                            ? 'rgba(41, 151, 255, 0.2)'
                            : isAgrav
                              ? 'rgba(191, 90, 242, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)'

                      const classBadgeColor = isFelony
                        ? '#ff453a'
                        : isMisd
                          ? '#ff9f0a'
                          : isInf
                            ? '#2997ff'
                            : isAgrav
                              ? '#bf5af2'
                              : '#ffffff'

                      return (
                        <div
                          key={art.id}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#2997ff', fontWeight: 700, fontSize: '13px' }}>{art.nombre}</span>
                            {art.clase && (
                              <span
                                style={{
                                  background: classBadgeBg,
                                  color: classBadgeColor,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  letterSpacing: '0.3px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {art.clase}
                              </span>
                            )}
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', lineHeight: 1.4 }}>{art.descripcion}</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ff9f0a', fontWeight: 700, marginTop: 'auto', paddingTop: '4px' }}>
                            <span>Multa: ${art.dinero.toLocaleString()}</span>
                            <span>Prisión: {art.tiempo} {art.tiempo === 999 ? '(Perpetua)' : 'meses'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </MDTCard>
            </MDTGridItem>
          </MDTGridContainer>
        )
      }

      case 'documentos':
        return (
          <MDTGridContainer>
            <MDTGridItem span={6}>
              <MDTCard title="Derechos Miranda" subtitle="Lectura Obligatoria al Detenido">
                <div style={{ color: '#fff', fontSize: '13px', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: 0, background: 'rgba(41, 151, 255, 0.1)', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #2997ff' }}>
                    "Tiene derecho a permanecer en silencio. Cualquier cosa que diga puede y será usada en su contra en un tribunal de justicia. Tiene derecho a hablar con un abogado y a tener un abogado presente durante el interrogatorio."
                  </p>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Protocolo obligatorio LAPD / LASD — Directiva N° 104-A</span>
                </div>
              </MDTCard>
            </MDTGridItem>
            <MDTGridItem span={6}>
              <MDTCard title="Uso Proporcional de la Fuerza" subtitle="Matriz de Intervención">
                <div style={{ color: '#fff', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}><strong>Nivel 1:</strong> Presencia policial y comandos verbales.</div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px' }}><strong>Nivel 2:</strong> Control físico sin armas y sujeción táctica.</div>
                  <div style={{ background: 'rgba(255, 159, 10, 0.15)', padding: '10px 14px', borderRadius: '8px', color: '#ff9f0a' }}><strong>Nivel 3:</strong> Armas no letales (Taser 7, Spray OC, Porra táctica).</div>
                  <div style={{ background: 'rgba(255, 69, 58, 0.15)', padding: '10px 14px', borderRadius: '8px', color: '#ff453a' }}><strong>Nivel 4:</strong> Fuerza letal (Armamento de fuego) ante amenaza inminente a la vida.</div>
                </div>
              </MDTCard>
            </MDTGridItem>
          </MDTGridContainer>
        )

      case 'llamadas':
        return <MDTCallsTab />

      case 'admin':
        return hasAdminPermission ? <MDTAdminPanel /> : null

      default:
        return (
          <div className={styles.contentBodyArea}>
            <span className={styles.placeholderLabel}>Content</span>
          </div>
        )
    }
  }

  // ─── DENIED ACCESS SCREEN ─────────────────────────────────────
  if (isAccessChecked && !officerAccess) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.scaler} ${!isFocused ? styles.unfocused : ''}`} style={{ transform: `scale(${scale})` }}>
          <div className={styles.tabletFrame}>
            <div className={styles.greenContentArea}>
              <div className={styles.bgBlurLayer} style={{ backgroundImage: `url(${tabletBg})` }} />
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', color: '#fff', textAlign: 'center', gap: '16px' }}>
                <div style={{ fontSize: '48px' }}>🛡️ 🔒</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                  ACCESO DENEGADO — SISTEMA MDT BLOQUEADO
                </h2>
                <p style={{ maxWidth: '520px', color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
                  El DNI o usuario no figura registrado ni habilitado en la base de datos de Oficiales Autorizados del Centro de Operaciones Policiales (LAPD / LASD / CHP).
                </p>
                <div style={{ background: 'rgba(255, 69, 58, 0.2)', border: '1px solid rgba(255, 69, 58, 0.4)', color: '#ff453a', padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                  CÓDIGO DE ERROR: UNAUTHORIZED_OFFICER_DNI
                </div>
                <button
                  type="button"
                  onClick={openPhone}
                  style={{ marginTop: '12px', background: 'linear-gradient(135deg, #0066cc, #2997ff)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,102,204,0.4)' }}
                >
                   Volver al Móvil
                </button>
              </div>
            </div>
            <img src={tabletFrameImg} alt="Tablet Frame" className={styles.tabletFrameImg} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.scaler} ${!isFocused ? styles.unfocused : ''}`}
        style={{ transform: `scale(${scale})` }}
      >
        <div className={styles.tabletFrame}>
          {/* Barra Superior de Arrastre de Ventana (Drag Handle) fuera del content, en el bisel/borde superior de la tableta */}
          <div className={styles.tabletDragBarWrapper} title="Mantén presionado y arrastra para mover la ventana del MDT">
            <div className={styles.tabletDragBarPill} />
          </div>

          {/* Contenido general detrás del marco con fondo con blur unificado */}
          <div className={styles.greenContentArea}>

            {/* Fondo base con blur y oscurecimiento táctico unificado */}
            <div
              className={styles.bgBlurLayer}
              style={{
                backgroundImage: `url(${tabletBg})`,
              }}
            />

            {/* Header del MDT Policial */}
            <div className={styles.mdtHeaderWrapper}>
              <header className={styles.mdtHeader}>
                {/* Izquierda: Logo California */}
                <div className={styles.headerLeft}>
                  <img
                    src={logoCalifornia}
                    className={styles.headerLogoImg}
                  />
                </div>

                {/* Centro: Barra de Búsqueda estilo URL Pill */}
                <div className={styles.headerSearchPill}>
                  <input
                    type="text"
                    placeholder="Buscar en el sistema NCIC (DNI / Matrícula)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value
                        if (val) {
                          setCitizenQuery(val)
                          setActiveTab('ciudadanos')
                          handleSearchCitizen(val)
                        }
                      }
                    }}
                    className={styles.headerSearchInput}
                  />
                  <span className={styles.searchIcon}></span>
                </div>

                {/* Derecha: Botones de Cambio de Estado Operativo */}
                <div className={styles.headerRight}>
                  <div className={styles.statusButtonsGroup}>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.status10_8} ${myDutyStatus === '10-8' ? styles.statusActive : ''}`}
                      onClick={async () => {
                        setMyDutyStatus('10-8')
                        if (officerAccess?.dni) {
                          await updatePoliciaEstado(officerAccess.dni, '10-8')
                        }
                      }}
                      title="10-8: En Servicio / Disponible"
                    >
                      <span></span> 10-8
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.status10_97} ${myDutyStatus === '10-97' ? styles.statusActive : ''}`}
                      onClick={async () => {
                        setMyDutyStatus('10-97')
                        if (officerAccess?.dni) {
                          await updatePoliciaEstado(officerAccess.dni, '10-97')
                        }
                      }}
                      title="10-97: En Camino / Respondiendo"
                    >
                      <span></span> 10-97
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.status10_23} ${myDutyStatus === '10-23' ? styles.statusActive : ''}`}
                      onClick={async () => {
                        setMyDutyStatus('10-23')
                        if (officerAccess?.dni) {
                          await updatePoliciaEstado(officerAccess.dni, '10-23')
                        }
                      }}
                      title="10-23: En Escena / En Ubicación"
                    >
                      <span></span> 10-23
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.status10_7} ${myDutyStatus === '10-7' ? styles.statusActive : ''}`}
                      onClick={async () => {
                        setMyDutyStatus('10-7')
                        if (officerAccess?.dni) {
                          await updatePoliciaEstado(officerAccess.dni, '10-7')
                        }
                      }}
                      title="10-7: Fuera de Servicio"
                    >
                      <span></span> 10-7
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${styles.statusCodigo3} ${myDutyStatus === 'codigo3' ? styles.statusActive : ''}`}
                      onClick={async () => {
                        setMyDutyStatus('codigo3')
                        if (officerAccess?.dni) {
                          await updatePoliciaEstado(officerAccess.dni, 'codigo3')
                        }
                      }}
                      title="Código 3: Emergencia"
                    >
                      <span className={styles.statusDotCodigo3} /> C-3
                    </button>
                  </div>
                </div>
              </header>

              {/* Separador: Raya azul izquierda + Línea de puntitos */}
              <div className={styles.headerDividerContainer}>
                <div className={styles.dividerBlueLine} />
                <div className={styles.dividerDottedLine} />
              </div>
            </div>

            {/* Cuerpo del MDT (Sidebar Nav + Área Principal) */}
            <div className={styles.mdtBodyContainer}>
              {/* Sidebar de Navegación Lateral */}
              <aside className={styles.mdtSidebar}>
                <nav className={styles.sidebarNavList}>
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.sidebarNavItem} ${activeTab === item.id ? styles.sidebarNavItemActive : ''
                        }`}
                      onClick={() => {
                        if (item.id === 'movil') {
                          openPhone()
                        } else {
                          setActiveTab(item.id)
                        }
                      }}
                    >
                      <span className={styles.navItemIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Perfil del Agente con foto Roblox y borde según estado */}
                {officerAccess && (
                  <div className={styles.sidebarUserCard}>
                    <div className={styles.userAvatarContainer}>
                      <img
                        src={
                          robloxAvatarUrl ||
                          getRobloxHeadshotDirectUrl(cleanRobloxUser || 'Roblox')
                        }
                        alt={officerAccess.nombre_completo}
                        className={styles.userAvatarImg}
                        onError={(e) => {
                          const el = e.currentTarget
                          const fallback = getRobloxHeadshotDirectUrl(cleanRobloxUser || 'Roblox')
                          if (el.src !== fallback) {
                            el.src = fallback
                          } else {
                            el.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                        }}
                        style={{
                          border: `2px solid ${myDutyStatus === '10-8'
                            ? '#30d158'
                            : myDutyStatus === '10-97'
                              ? '#ff9f0a'
                              : myDutyStatus === '10-23'
                                ? '#2997ff'
                                : myDutyStatus === 'codigo3'
                                  ? '#ff453a'
                                  : '#8e8e93'
                            }`,
                          boxShadow: `0 0 10px ${myDutyStatus === '10-8'
                            ? 'rgba(48,209,88,0.5)'
                            : myDutyStatus === '10-97'
                              ? 'rgba(255,159,10,0.5)'
                              : myDutyStatus === '10-23'
                                ? 'rgba(41,151,255,0.5)'
                                : myDutyStatus === 'codigo3'
                                  ? 'rgba(255,69,58,0.5)'
                                  : 'rgba(142,142,147,0.3)'
                            }`,
                        }}
                      />
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles.userName}>{officerAccess.nombre_completo}</span>
                      <span className={styles.userRank}>
                        {officerAccess.placa} • {officerAccess.rango || 'Police Officer II'}
                      </span>
                      <span className={styles.userPermsTag}>
                        {hasAdminPermission ? 'Chief / Admin' : 'Oficial'}
                      </span>
                    </div>
                  </div>
                )}
              </aside>

              {/* Área Principal de Contenido Limpia con Divider */}
              <main className={`${styles.mdtMainContent} app-scroll`}>
                <div className={styles.contentHeaderArea}>
                  <h2 className={styles.contentSectionTitle}>
                    {navItems.find((n) => n.id === activeTab)?.label || 'Inicio'}
                  </h2>
                  <div className={styles.contentSectionDivider} />
                </div>
                <div className={styles.contentBodyArea}>
                  {renderTabContent()}
                </div>
              </main>
            </div>

            {/* Portal target para modales contenidos exclusivamente DENTRO de la pantalla de la tablet */}
            <div id="mdt-tablet-screen-root" className={styles.tabletScreenModalRoot} />

            {/* Contenedor de notificaciones de la tablet (deslizado abajo a la derecha) */}
            <TabletNotificationContainer />
          </div>

          {/* Marco de la tablet superpuesto */}
          <img
            src={tabletFrameImg}
            alt="Tablet Frame"
            className={styles.tabletFrameImg}
          />
        </div>
      </div>
    </div>
  )
}
