import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import satelliteMap from '@/assets/maps/satellite.png'
import { getMapCoordinates, formatLocationData } from '@/apps/MapaApp'
import { getLlamadas } from '@/services/mdtService'
import type { LlamadaItem } from '@/types/mdt'
import styles from './MDTFullMapTab.module.css'

interface ActiveOfficerMarker {
  id: string
  callsign: string
  playerName: string
  team: string
  x: number
  y: number
  postal: string
  estado: string
  isCurrentUser: boolean
}

function getStatusColor(status?: string): string {
  switch (status) {
    case '10-8':
      return '#30d158'
    case '10-97':
      return '#ff9f0a'
    case '10-23':
      return '#2997ff'
    case 'codigo3':
      return '#ff453a'
    case '10-7':
      return '#8e8e93'
    default:
      return '#30d158'
  }
}

export function MDTFullMapTab() {
  const { personaje, user } = useAuth()
  const [officers, setOfficers] = useState<ActiveOfficerMarker[]>([])
  const [calls, setCalls] = useState<LlamadaItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null)
  const [selectedCallNumber, setSelectedCallNumber] = useState<number | null>(null)
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)

  // Zoom y Arrastre del Mapa Satélite Grande
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDragging = useRef<boolean>(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)

  const MAP_SIZE = 3121 // natural image px

  const clampPan = (p: { x: number; y: number }, z: number) => {
    const vp = viewportRef.current
    if (!vp) return p
    // how much of the 3121px canvas (at scale z) overflows each side
    const maxX = Math.max(0, (MAP_SIZE * z - vp.clientWidth) / 2)
    const maxY = Math.max(0, (MAP_SIZE * z - vp.clientHeight) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    }
  }

  const MIN_ZOOM = 0.15 // zoom minimo
  const MAX_ZOOM = 4.5 // zoom maximo

  const handleZoomIn = () => setZoom((z) => {
    const next = Math.min(MAX_ZOOM, Math.round((z + 0.25) * 100) / 100)
    setPan((p) => clampPan(p, next))
    return next
  })

  const handleZoomOut = () => setZoom((z) => {
    const next = Math.max(MIN_ZOOM, Math.round((z - 0.25) * 100) / 100)
    setPan((p) => clampPan(p, next))
    return next
  })

  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedOfficerId(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) handleZoomIn()
    else handleZoomOut()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan(clampPan({ x: panStart.current.x + dx, y: panStart.current.y + dy }, zoom))
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  // Centrar mapa en un oficial al hacer clic en la lista
  const handleSelectOfficer = (officer: ActiveOfficerMarker) => {
    setSelectedOfficerId(officer.id)
    setZoom(2.5)

    // Convertir porcentaje x,y en desplazamiento relativo al centro (50%, 50%)
    const targetPanX = (50 - officer.x) * 2.2
    const targetPanY = (50 - officer.y) * 2.2
    setPan({ x: targetPanX, y: targetPanY })
  }

  const fetchActiveOfficers = useCallback(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    const candidateNames = [
      personaje?.usuario_roblox,
      personaje?.nombre,
      user?.user_metadata?.preferred_username,
      user?.user_metadata?.full_name,
      user?.user_metadata?.name,
    ]
      .filter(Boolean)
      .map((n) => String(n).replace(/^@/, '').trim().toLowerCase())

    let erlcData: any = null

    try {
      const res = await supabase.functions.invoke('erlc-server', {
        body: { name: 'Functions' },
      })
      erlcData = res.data
    } catch {
      /* fallback to HTTP */
    }

    if (!erlcData && supabaseUrl) {
      try {
        const sessionRes = await supabase.auth.getSession()
        const token = sessionRes.data.session?.access_token || supabaseAnonKey
        const httpRes = await fetch(`${supabaseUrl}/functions/v1/erlc-server`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey || '',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: 'Functions' }),
        })
        if (httpRes.ok) {
          erlcData = await httpRes.json()
        }
      } catch {
        /* ignore */
      }
    }

    let rawArray: any[] = []
    if (erlcData) {
      if (Array.isArray(erlcData.players)) rawArray = erlcData.players
      else if (Array.isArray(erlcData.Players)) rawArray = erlcData.Players
      else if (Array.isArray(erlcData)) rawArray = erlcData
      else if (Array.isArray(erlcData.data?.players)) rawArray = erlcData.data.players
    }

    let policiasDb: any[] = []
    try {
      const { data } = await supabase.from('policias').select('*')
      if (data) policiasDb = data
    } catch {
      /* ignore */
    }

    if (!rawArray || rawArray.length === 0) {
      setOfficers([])
      setIsLoading(false)
      return
    }

    const activeList: ActiveOfficerMarker[] = []

    rawArray.forEach((p: any, idx: number) => {
      const rawTeam = (p.team || p.Team || '').toString()
      const normalizedTeam = rawTeam.toLowerCase().trim()
      const isPoliceOrSheriff =
        normalizedTeam === 'police' ||
        normalizedTeam === 'sheriff' ||
        normalizedTeam.includes('police') ||
        normalizedTeam.includes('sheriff')

      if (!isPoliceOrSheriff) return

      const rawPlayerStr = (p.player || p.Player || p.name || p.username || '').toString()
      const cleanPlayer = rawPlayerStr.includes(':') ? rawPlayerStr.split(':')[0] : rawPlayerStr
      const cleanUser = cleanPlayer.replace(/^@/, '').trim().toLowerCase()

      const isCurrentUser = candidateNames.some(
        (target) => target && (cleanUser === target || cleanUser.includes(target) || target.includes(cleanUser))
      )

      const matchedDbOfficer = policiasDb.find((dbP) => {
        const dbName = (dbP.nombre_completo || '').toLowerCase()
        const dbUser = (dbP.usuario_roblox || dbP.nombre_completo || '').replace(/^@/, '').toLowerCase()
        return dbUser.includes(cleanUser) || cleanUser.includes(dbUser) || dbName.includes(cleanUser)
      })

      const location = p.location ?? p.Location ?? p.pos
      const coords = getMapCoordinates(location)
      const locInfo = formatLocationData(location)
      const formattedPostal = locInfo.postal !== '-' ? locInfo.postal : 'Postal 100'

      const userPlaca = (personaje as any)?.placa
      let rawBadge = matchedDbOfficer?.placa || (p.callsign || p.Callsign || '').toString()
      if (!rawBadge && isCurrentUser && userPlaca) {
        rawBadge = userPlaca
      }
      if (!rawBadge) {
        rawBadge = `#${idx + 101}`
      }
      const badgeStr = rawBadge.startsWith('#') ? rawBadge : `#${rawBadge}`
      const currentEstado = matchedDbOfficer?.estado || (p.estado || '10-8')

      activeList.push({
        id: `full-off-${idx}-${cleanUser}`,
        callsign: badgeStr,
        playerName: matchedDbOfficer?.nombre_completo || cleanPlayer,
        team: rawTeam || 'Police',
        x: coords.x,
        y: coords.y,
        postal: formattedPostal,
        estado: currentEstado,
        isCurrentUser,
      })
    })

    setOfficers(activeList)
    setIsLoading(false)
  }, [personaje, user])

  const fetchActiveCalls = useCallback(async () => {
    const data = await getLlamadas()
    setCalls(data)
  }, [])

  useEffect(() => {
    fetchActiveOfficers()
    fetchActiveCalls()

    const intervalId = setInterval(() => {
      fetchActiveOfficers()
      fetchActiveCalls()
    }, 5000)
    return () => clearInterval(intervalId)
  }, [fetchActiveOfficers, fetchActiveCalls])

  // Filtrar oficial por búsqueda
  const filteredOfficers = officers.filter((off) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      off.callsign.toLowerCase().includes(q) ||
      off.playerName.toLowerCase().includes(q) ||
      off.postal.toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.container}>
      {/* Columna Izquierda: Lista de Unidades de Servicio */}
      <div className={styles.leftPanel}>
        <div className={styles.headerGroup}>
          <h3 className={styles.panelTitle}>Unidades de Servicio</h3>
          <span className={styles.panelSubtitle}>Seguimiento GPS</span>
        </div>

        {/* Buscador de Unidades */}
        <input
          type="text"
          placeholder="Buscar por placa (#209), oficial o postal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />

        {/* Lista Scrollable de Unidades */}
        {filteredOfficers.length > 0 ? (
          <div className={`${styles.unitsList} app-scroll`}>
            {filteredOfficers.map((officer) => {
              const isSelected = selectedOfficerId === officer.id
              const statusColor = getStatusColor(officer.estado)

              return (
                <div
                  key={officer.id}
                  className={`${styles.unitCard} ${isSelected ? styles.unitCardSelected : ''}`}
                  onClick={() => handleSelectOfficer(officer)}
                >
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: statusColor,
                      boxShadow: `0 0 8px ${statusColor}`,
                    }}
                  />
                  <div className={styles.unitMeta}>
                    <div className={styles.unitCallsignRow}>
                      <span className={styles.unitBadge}>{officer.callsign}</span>
                      <span
                        className={styles.unitEstadoTag}
                        style={{
                          backgroundColor: `${statusColor}22`,
                          color: statusColor,
                          border: `1px solid ${statusColor}44`,
                        }}
                      >
                        {officer.estado}
                      </span>
                    </div>
                    <span className={styles.unitName}>{officer.playerName}</span>
                    <span className={styles.unitPostal}> {officer.postal}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>
              {isLoading
                ? 'Conectando GPS...'
                : searchQuery
                  ? 'No se encontraron unidades con el filtro ingresado'
                  : 'No constan patrullas policiales activas en el mapa'}
            </span>
          </div>
        )}

        {/* Pie del Panel de Unidades */}
        <div className={styles.statusFooter}>
          <span>Unidades Activas</span>
          <span>{officers.length} en línea</span>
        </div>
      </div>

      {/* Columna Derecha: Visor de Mapa Satélite Grande */}
      <div className={styles.rightPanel}>
        {/* Controles de Zoom */}
        <div className={styles.zoomControls}>
          <button type="button" className={styles.zoomBtn} onClick={handleZoomIn} title="Acercar (+)">
            +
          </button>
          <button type="button" className={styles.zoomBtn} onClick={handleZoomOut} title="Alejar (-)">
            −
          </button>
          {zoom > 1 && (
            <button type="button" className={styles.zoomBtn} onClick={handleResetZoom} title="Restablecer Vista (1x)">
              ↺
            </button>
          )}
        </div>

        {/* Viewport Interactivo con Zoom y Drag Pan */}
        <div
          ref={viewportRef}
          className={styles.mapViewport}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className={styles.mapContent}
            style={{
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            }}
          >
            <img
              src={satelliteMap}
              alt="Mapa Satélite Oficial Los Ángeles"
              className={styles.mapImg}
            />

            {/* Marcadores de Llamadas CAD Activas */}
            {calls
              .filter((c) => !c.estado)
              .map((call) => {
                const coords = getMapCoordinates(call.coordenadas || call.lugar)
                const isSelected = selectedCallNumber === call.numero
                const isHovered = hoveredPinId === `call-${call.numero}`
                const baseScale = 1 / zoom
                const finalScale = isSelected ? baseScale * 1.8 : isHovered ? baseScale * 1.4 : baseScale

                return (
                  <div
                    key={`call-${call.numero}`}
                    className={`${styles.callPinDot} ${isSelected ? styles.callPinSelected : ''}`}
                    onMouseEnter={() => setHoveredPinId(`call-${call.numero}`)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCallNumber(call.numero)
                      setSelectedOfficerId(null)
                    }}
                    style={{
                      left: `${coords.x}%`,
                      top: `${coords.y}%`,
                      transform: `translate(-50%, -50%) scale(${finalScale})`,
                    }}
                  >
                    <div className={styles.callPinBadge}>
                      <span>🚨</span>
                      <span>#{call.numero}</span>
                    </div>

                    <div
                      className={styles.mapPinTooltip}
                      style={{
                        transform: `translateX(-50%) translateY(-${6 * zoom}px) scale(${zoom})`,
                      }}
                    >
                      <span className={styles.tooltipCallsign}>LLAMADA #{call.numero}</span>
                      <span className={styles.tooltipOfficerName}>{call.descripcion || 'Emergencia'}</span>
                      <span className={styles.tooltipPostal}>{call.lugar}</span>
                    </div>
                  </div>
                )
              })}

            {/* Marcadores de Unidades */}
            {officers.map((officer) => {
              const isSelected = selectedOfficerId === officer.id
              const isHovered = hoveredPinId === officer.id
              const baseScale = 1 / zoom
              const finalScale = isSelected ? baseScale * 2 : isHovered ? baseScale * 1.5 : baseScale
              const statusColor = getStatusColor(officer.estado)

              return (
                <div
                  key={officer.id}
                  className={`${styles.mapPinDot} ${isSelected ? styles.mapPinSelected : ''}`}
                  onMouseEnter={() => setHoveredPinId(officer.id)}
                  onMouseLeave={() => setHoveredPinId(null)}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectOfficer(officer)
                  }}
                  style={{
                    left: `${officer.x}%`,
                    top: `${officer.y}%`,
                    backgroundColor: statusColor,
                    borderColor: '#ffffff',
                    boxShadow: isSelected
                      ? `0 0 16px ${statusColor}`
                      : `0 0 ${8 / zoom}px ${statusColor}`,
                    transform: `translate(-50%, -50%) scale(${finalScale})`,
                  }}
                >
                  {/* Tooltip Emergente */}
                  <div
                    className={styles.mapPinTooltip}
                    style={{
                      transform: `translateX(-50%) translateY(-${6 * zoom}px) scale(${zoom})`,
                    }}
                  >
                    <span className={styles.tooltipCallsign}>{officer.callsign}</span>
                    <span className={styles.tooltipOfficerName}>{officer.playerName}</span>
                    <span className={styles.tooltipPostal}>{officer.postal}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
