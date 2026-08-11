import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import satelliteMap from '@/assets/maps/satellite.png'
import { getMapCoordinates, formatLocationData } from '@/apps/MapaApp'
import { MDTCard } from './MDTCard'
import styles from './MDTMapCard.module.css'

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



export function MDTMapCard() {
  const { personaje, user } = useAuth()
  const [officers, setOfficers] = useState<ActiveOfficerMarker[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)

  // Zoom y Arrastre del Mapa Satélite
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDragging = useRef<boolean>(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const handleZoomIn = () => setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(1, Math.round((z - 0.5) * 10) / 10)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }
  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || zoom <= 1) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const maxPan = (zoom - 1) * 110
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, panStart.current.x + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, panStart.current.y + dy)),
    })
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const fetchActiveOfficers = useCallback(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // Candidatos a nombre de usuario de Roblox del usuario autenticado
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

    // Policias registrados en la base de datos para cruzar placas e indicativos
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

      // Coincidencia con base de datos de policías
      const matchedDbOfficer = policiasDb.find((dbP) => {
        const dbName = (dbP.nombre_completo || '').toLowerCase()
        const dbUser = (dbP.usuario_roblox || dbP.nombre_completo || '').replace(/^@/, '').toLowerCase()
        return dbUser.includes(cleanUser) || cleanUser.includes(dbUser) || dbName.includes(cleanUser)
      })

      // Formato del código postal y coordenadas con el displacement calibrado del mapa
      const location = p.location ?? p.Location ?? p.pos
      const coords = getMapCoordinates(location)
      const locInfo = formatLocationData(location)
      const formattedPostal = locInfo.postal !== '-' ? locInfo.postal : 'Postal 100'

      // Número de Placa / Indicativo
      const userPlaca = (personaje as any)?.placa
      let rawBadge = matchedDbOfficer?.placa || (p.callsign || p.Callsign || '').toString()
      if (!rawBadge && isCurrentUser && userPlaca) {
        rawBadge = userPlaca
      }
      if (!rawBadge) {
        rawBadge = `#${idx + 101}`
      }
      const badgeStr = rawBadge.startsWith('#') ? rawBadge : `#${rawBadge}`

      // Estado operativo
      const currentEstado = matchedDbOfficer?.estado || (p.estado || '10-8')

      activeList.push({
        id: `off-${idx}-${cleanUser}`,
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

  useEffect(() => {
    fetchActiveOfficers()
    const intervalId = setInterval(fetchActiveOfficers, 3000)
    return () => clearInterval(intervalId)
  }, [fetchActiveOfficers])

  return (
    <MDTCard>
      <div className={styles.cardContainer}>
        {/* Panel Izquierdo: Título, Subtítulo, Lista de Patrullas y Estado */}
        <div className={styles.leftPanel}>
          <div className={styles.headerGroup}>
            <h3 className={styles.cardTitle}>Ubicación GPS de Unidades</h3>
            <span className={styles.cardSubtitle}>Seguimiento GPS</span>
          </div>

          {/* Lista de Patrullas Activas */}
          {officers.length > 0 ? (
            <div className={`${styles.officersList} app-scroll`}>
              {officers.map((officer) => (
                <div key={officer.id} className={styles.officerRow}>
                  {/* Puntito de color según estado */}
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: getStatusColor(officer.estado),
                      boxShadow: `0 0 8px ${getStatusColor(officer.estado)}`,
                    }}
                  />
                  <div className={styles.officerRowMeta}>
                    <span className={styles.officerBadge}>{officer.callsign}</span>
                    <span className={styles.officerPostal}>{officer.postal}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span>No constan patrullas policiales activas en el mapa</span>
            </div>
          )}

          {/* Pie del Panel: Estado del GPS */}
          <div className={styles.statusFooter}>
            <span>
              {isLoading
                ? '󱥸 Conectando GPS en vivo...'
                : officers.length > 0
                  ? ` GPS Satélite: ${officers.length} ${officers.length === 1 ? 'patrulla activa' : 'patrullas activas'}`
                  : ' Sin patrullas activas'}
            </span>
          </div>
        </div>

        {/* Panel Derecho: Mapa Cuadrado Satélite con Zoom Interactivo */}
        <div className={styles.rightPanel}>
          {/* Botones de Control de Zoom */}
          <div className={styles.zoomControls}>
            <button type="button" className={styles.zoomBtn} onClick={handleZoomIn} title="Acercar (+)">
              +
            </button>
            <button type="button" className={styles.zoomBtn} onClick={handleZoomOut} title="Alejar (-)">
              −
            </button>
            {zoom > 1 && (
              <button type="button" className={styles.zoomBtn} onClick={handleResetZoom} title="Restablecer Zoom (1x)">
                ↺
              </button>
            )}
          </div>

          {/* Viewport Interactivo con Zoom y Arrastre */}
          <div
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
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <img
                src={satelliteMap}
                alt="Mapa Policial Satélite Los Ángeles"
                className={styles.mapImg}
              />
              {officers.map((officer) => {
                const isHovered = hoveredPinId === officer.id
                const baseScale = 1 / zoom
                const finalScale = isHovered ? baseScale * 1.5 : baseScale

                return (
                  <div
                    key={officer.id}
                    className={styles.mapPinDot}
                    onMouseEnter={() => setHoveredPinId(officer.id)}
                    onMouseLeave={() => setHoveredPinId(null)}
                    style={{
                      left: `${officer.x}%`,
                      top: `${officer.y}%`,
                      backgroundColor: getStatusColor(officer.estado),
                      borderColor: '#ffffff',
                      boxShadow: `0 0 ${8 / zoom}px ${getStatusColor(officer.estado)}`,
                      transform: `translate(-50%, -50%) scale(${finalScale})`,
                    }}
                  >
                    {/* Tooltip en Hover contrarrestando escala */}
                    <div
                      className={styles.mapPinTooltip}
                      style={{
                        transform: `translateX(-50%) translateY(-${6 * zoom}px) scale(${zoom})`,
                      }}
                    >
                      <span className={styles.tooltipCallsign}>{officer.callsign}</span>
                      <span className={styles.tooltipPostal}>{officer.postal}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </MDTCard>
  )
}
