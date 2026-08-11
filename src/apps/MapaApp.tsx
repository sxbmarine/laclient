import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import type { ErlcPlayer } from '@/types/database'

import streetMap from '@/assets/maps/street.png'
import satelliteMap from '@/assets/maps/satellite.png'
import darkMap from '@/assets/maps/dark.png'

import styles from './MapaApp.module.css'

export function formatLocationData(rawLoc: any): { calle: string; postal: string; edificio: string } {
  if (!rawLoc) {
    return { calle: 'Cargando...', postal: '-', edificio: '-' }
  }

  let text = ''
  let customBuilding = ''

  if (typeof rawLoc === 'object' && rawLoc !== null) {
    const street = rawLoc.StreetName || rawLoc.street || rawLoc.Street || rawLoc.name || rawLoc.Name || ''
    const postal = rawLoc.PostalCode || rawLoc.postal || rawLoc.Postal || rawLoc.post || ''
    const building = rawLoc.BuildingNumber || rawLoc.building || rawLoc.Building || rawLoc.number || rawLoc.Number || ''

    if (street || postal || building) {
      return {
        calle: street ? String(street) : (postal ? `Postal ${postal}` : 'Los Ángeles'),
        postal: postal ? `Postal ${postal}` : '-',
        edificio: building ? `Nº ${building}` : '-',
      }
    }
    text = Object.values(rawLoc).filter((v) => typeof v === 'string' || typeof v === 'number').join(', ')
  } else {
    text = String(rawLoc)
  }

  if (text.includes('[object Object]') || !text.trim()) {
    return { calle: 'Obteniendo datos de API...', postal: '-', edificio: '-' }
  }

  // Extract postal number if present in text
  const postalMatch = text.match(/\d+/)
  const postalNum = postalMatch ? postalMatch[0] : ''
  const postalStr = postalNum ? `Postal ${postalNum}` : '-'

  // Split text by comma to separate zone/street name
  const parts = text.split(',').map((s) => s.trim())
  let calleStr = parts[0] || text

  return {
    calle: calleStr || 'Los Ángeles',
    postal: postalStr,
    edificio: customBuilding || '-',
  }
}

export function getMapCoordinates(rawLoc: any): { x: number; y: number } {
  if (!rawLoc) return { x: 50, y: 50 }

  // 1. Direct world coordinate calculation if LocationX and LocationZ are provided
  if (typeof rawLoc === 'object' && rawLoc !== null) {
    const locX = rawLoc.LocationX ?? rawLoc.x ?? rawLoc.X
    const locZ = rawLoc.LocationZ ?? rawLoc.z ?? rawLoc.Z ?? rawLoc.LocationY ?? rawLoc.y
    if (typeof locX === 'number' && typeof locZ === 'number') {
      // ER:LC map world coordinates range approximately from 0 to 4096 (or -500 to 4500)
      // Percentage = (worldCoord / 4096) * 100
      const x = Math.max(5, Math.min(95, (locX / 4096) * 133.8))
      const y = Math.max(5, Math.min(95, (locZ / 4096) * 124.3))
      return { x, y }
    }
    if (rawLoc.PostalCode) {
      return getMapCoordinates(String(rawLoc.PostalCode))
    }
    if (rawLoc.StreetName) {
      return getMapCoordinates(String(rawLoc.StreetName))
    }
  }

  const locationStr = typeof rawLoc === 'string' ? rawLoc : JSON.stringify(rawLoc)
  const locLower = locationStr.toLowerCase()
  const numbers = locationStr.match(/\d+/g)

  // 2. Postal code mapping for 1, 2, 3, 4 digit postals (e.g. "1107", "102", "204", etc.)
  if (numbers && numbers.length > 0) {
    const postal = parseInt(numbers[0], 10)

    // 100 - 199: River City / Downtown
    if (postal >= 100 && postal < 200) {
      const sub = postal - 100
      if (sub < 20) return { x: 42 + (sub % 10) * 0.8, y: 46 + Math.floor(sub / 10) * 2 }
      if (sub < 40) return { x: 50 + (sub % 10) * 0.8, y: 46 + Math.floor((sub - 20) / 10) * 2 }
      if (sub < 60) return { x: 35 + (sub % 10) * 0.7, y: 46 + Math.floor((sub - 40) / 10) * 2.5 }
      if (sub < 80) return { x: 42 + (sub % 10) * 1.0, y: 40 + Math.floor((sub - 60) / 10) * 2.5 }
      return { x: 42 + (sub % 10) * 1.0, y: 52 + Math.floor((sub - 80) / 10) * 2.5 }
    }

    // 200 - 299: Springfield
    if (postal >= 200 && postal < 300) {
      const sub = postal - 200
      if (sub < 50) return { x: 62 + (sub % 10) * 1.0, y: 28 + Math.floor(sub / 10) * 1.6 }
      return { x: 72 + (sub % 10) * 1.0, y: 28 + Math.floor((sub - 50) / 10) * 1.6 }
    }

    // 300 - 399: Highland Suburbs
    if (postal >= 300 && postal < 400) {
      const sub = postal - 300
      if (sub < 50) return { x: 62 + (sub % 10) * 1.0, y: 56 + Math.floor(sub / 10) * 1.6 }
      return { x: 55 + (sub % 10) * 1.0, y: 64 + Math.floor((sub - 50) / 10) * 1.6 }
    }

    // 400 - 499: County / Mountains & Farms
    if (postal >= 400 && postal < 500) {
      const sub = postal - 400
      if (sub < 50) return { x: 25 + (sub % 10) * 1.1, y: 24 + Math.floor(sub / 10) * 2.2 }
      return { x: 20 + (sub % 10) * 1.0, y: 35 + Math.floor((sub - 50) / 10) * 2.2 }
    }

    // 500 - 599: Industrial & Docks
    if (postal >= 500 && postal < 600) {
      const sub = postal - 500
      if (sub < 50) return { x: 40 + (sub % 10) * 1.5, y: 72 + Math.floor(sub / 10) * 2.0 }
      return { x: 22 + (sub % 10) * 1.6, y: 72 + Math.floor((sub - 50) / 10) * 2.5 }
    }

    // 1000 - 1999: 4-digit postals e.g. "1107"
    if (postal >= 1000 && postal < 2000) {
      const sub = postal % 100
      return {
        x: Math.max(15, Math.min(85, 30 + (sub % 10) * 5)),
        y: Math.max(15, Math.min(85, 35 + Math.floor(sub / 10) * 4)),
      }
    }

    // Generic postal fallback
    const x = 15 + ((postal * 17) % 70)
    const y = 15 + ((postal * 31) % 70)
    return { x, y }
  }

  // 3. Street / Location keyword matchers
  if (locLower.includes('elm')) return { x: 45, y: 48 }
  if (locLower.includes('main')) return { x: 50, y: 50 }
  if (locLower.includes('police') || locLower.includes('pd') || locLower.includes('comisaria')) return { x: 50, y: 52 }
  if (locLower.includes('sheriff') || locLower.includes('so')) return { x: 35, y: 38 }
  if (locLower.includes('fire') || locLower.includes('bomberos') || locLower.includes('fd')) return { x: 53, y: 48 }
  if (locLower.includes('hospital') || locLower.includes('ems') || locLower.includes('medical')) return { x: 48, y: 54 }
  if (locLower.includes('bank') || locLower.includes('banco')) return { x: 50, y: 46 }
  if (locLower.includes('jewelry') || locLower.includes('joyeria')) return { x: 52, y: 45 }
  if (locLower.includes('gun') || locLower.includes('armaria')) return { x: 44, y: 60 }
  if (locLower.includes('dealership') || locLower.includes('concesionario') || locLower.includes('car')) return { x: 60, y: 55 }
  if (locLower.includes('gas') || locLower.includes('gasolinera')) return { x: 46, y: 42 }
  if (locLower.includes('tool') || locLower.includes('hardware')) return { x: 40, y: 50 }
  if (locLower.includes('river')) return { x: 38, y: 42 }
  if (locLower.includes('springfield')) return { x: 68, y: 32 }
  if (locLower.includes('civic')) return { x: 52, y: 58 }
  if (locLower.includes('highway') || locLower.includes('carretera')) return { x: 55, y: 72 }
  if (locLower.includes('downtown') || locLower.includes('centro')) return { x: 48, y: 48 }
  if (locLower.includes('dmv')) return { x: 45, y: 52 }
  if (locLower.includes('spawn')) return { x: 50, y: 50 }
  if (locLower.includes('farm') || locLower.includes('granja')) return { x: 25, y: 30 }
  if (locLower.includes('airport') || locLower.includes('aeropuerto')) return { x: 75, y: 80 }
  if (locLower.includes('dock') || locLower.includes('puerto')) return { x: 20, y: 75 }

  // Hash fallback
  let hash = 0
  for (let i = 0; i < locLower.length; i++) {
    hash = (hash << 5) - hash + locLower.charCodeAt(i)
    hash |= 0
  }
  const posHash = Math.abs(hash)
  return {
    x: 20 + (posHash % 60),
    y: 20 + ((posHash >> 3) % 60),
  }
}

export function MapaApp() {
  const navigate = useNavigate()
  const { personaje, user } = useAuth()

  const [mapType, setMapType] = useState<'street' | 'satellite' | 'dark'>('street')
  const [activePlayer, setActivePlayer] = useState<ErlcPlayer | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playerCount, setPlayerCount] = useState<number>(0)

  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [minZoom, setMinZoom] = useState(0.1)
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const cleanUsername = (personaje?.usuario_roblox || '')
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .trim()

  // ─── Avatar loading ───────────────────────────────────────────────────
  useEffect(() => {
    const targetName = cleanUsername || 'Roblox'
    setAvatarUrl(
      `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
        targetName,
      )}&width=150&height=150&format=png`,
    )
    let active = true
    getRobloxAvatarUrl(targetName).then((url) => {
      if (active && url) setAvatarUrl(url)
    })
    return () => { active = false }
  }, [cleanUsername])

  const avatarSrc =
    avatarUrl ||
    `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
      cleanUsername || 'Roblox',
    )}&width=150&height=150&format=png`

  const logToTerminal = useCallback((...args: any[]) => {
    console.log('[MAPA-APP]', ...args)
    const api = window.electronAPI as any
    if (api?.logTerminal) {
      api.logTerminal('[MAPA-APP]', ...args).catch(() => { })
    }
  }, [])

  // ─── ERLC data ────────────────────────────────────────────────────────
  const fetchMap = useCallback(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    logToTerminal('📡 Iniciando consulta a erlc-server...')

    let erlcData: any = null
    let fnError: any = null

    // Intento 1: SDK de Supabase functions.invoke
    try {
      const res = await supabase.functions.invoke('erlc-server', {
        body: { name: 'Functions' },
      })
      erlcData = res.data
      fnError = res.error
      if (fnError) logToTerminal('⚠️ Intento 1 (SDK) error:', fnError)
      if (erlcData) logToTerminal('ℹ️ Intento 1 (SDK) respuesta:', erlcData)
    } catch (err: any) {
      fnError = err
      logToTerminal('⚠️ Intento 1 (SDK) excepción:', err?.message || err)
    }

    // Fallback directo HTTP por si el SDK de Electron/Navegador intercepta la petición
    if ((!erlcData || fnError) && supabaseUrl) {
      try {
        logToTerminal('🔄 Ejecutando fallback HTTP directo a:', `${supabaseUrl}/functions/v1/erlc-server`)
        const sessionRes = await supabase.auth.getSession()
        const token = sessionRes.data.session?.access_token || supabaseAnonKey
        const httpRes = await fetch(`${supabaseUrl}/functions/v1/erlc-server`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey || '',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: 'Functions' }),
        })

        logToTerminal('ℹ️ HTTP Status Directo:', httpRes.status, httpRes.statusText)

        if (httpRes.ok) {
          erlcData = await httpRes.json()
          fnError = null
          logToTerminal('✅ Intento 2 (HTTP Directo) éxito:', erlcData)
        } else {
          const errData = await httpRes.json().catch(() => null)
          fnError = errData?.error || `HTTP ${httpRes.status} ${httpRes.statusText}`
          logToTerminal('❌ Intento 2 (HTTP Directo) error:', fnError)
        }
      } catch (directErr: any) {
        logToTerminal('❌ Intento 2 (HTTP Directo) excepción:', directErr?.message || directErr)
      }
    }

    if (fnError && !erlcData) {
      logToTerminal('❌ FALLO FINAL Edge Function:', fnError)
      setApiStatus('error')
      const errMsg = typeof fnError === 'string' ? fnError : (fnError.message || 'Error al conectar con Edge Function erlc-server')
      setErrorMessage(errMsg)
    }

    if (erlcData?.error) {
      logToTerminal('⚠️ Edge Function devolvió campo error:', erlcData.error)
      setApiStatus('error')
      setErrorMessage(erlcData.error)
    }

    let rawArray: any[] = []
    if (erlcData) {
      if (Array.isArray(erlcData.players)) {
        rawArray = erlcData.players
      } else if (Array.isArray(erlcData.Players)) {
        rawArray = erlcData.Players
      } else if (Array.isArray(erlcData)) {
        rawArray = erlcData
      } else if (Array.isArray(erlcData.data?.players)) {
        rawArray = erlcData.data.players
      }
    }

    setPlayerCount(rawArray.length)
    logToTerminal('👥 Jugadores decodificados en respuesta:', rawArray.length, rawArray)

    // Candidate Roblox usernames for the logged-in user
    const candidateNames = [
      personaje?.usuario_roblox,
      user?.user_metadata?.preferred_username,
      user?.user_metadata?.full_name,
      user?.user_metadata?.name,
      user?.user_metadata?.custom_claims?.global_name,
    ]
      .filter(Boolean)
      .map((name) => String(name).replace(/^@/, '').trim().toLowerCase())

    logToTerminal('🔍 Nombres candidatas de usuario Roblox:', candidateNames)

    if (rawArray.length > 0) {
      setApiStatus('connected')
      setErrorMessage(null)

      // 1. Try matching any candidate name
      let found = rawArray.find((p: any) => {
        const rawName = (p.player || p.Player || p.name || p.username || '').toString()
        const pName = rawName.includes(':') ? rawName.split(':')[0] : rawName
        const cleanName = pName.replace(/^@/, '').trim().toLowerCase()
        return candidateNames.some(
          (target) => target && (cleanName === target || cleanName.includes(target) || target.includes(cleanName)),
        )
      })

      // 2. If no exact candidate match, fallback to the 1st active player in rawArray so movement is always live!
      if (!found) {
        found = rawArray[0]
      }

      if (found) {
        logToTerminal('🎯 Jugador activo seleccionado para el mapa:', found)
        const location = found.location ?? found.Location ?? found.pos
        const team = (found.team || found.Team || 'Civilian').toString()
        const callsign = (found.callsign || found.Callsign || '').toString()
        const rawPlayerStr = (found.player || found.Player || cleanUsername || 'Jugador').toString()
        const displayPlayerName = rawPlayerStr.includes(':') ? rawPlayerStr.split(':')[0] : rawPlayerStr

        setActivePlayer({
          player: displayPlayerName,
          location,
          team,
          callsign,
          personaje: personaje || undefined,
        })
        return
      }
    }

    // Fallback opcional: Ubicaciones en Supabase
    try {
      const discordId = personaje?.discord_id
      if (discordId) {
        const { data: ubi } = await supabase
          .from('ubicaciones')
          .select('*')
          .eq('discord_id', discordId)
          .maybeSingle()

        if (ubi && ubi.lat && ubi.lng) {
          setActivePlayer({
            player: `${cleanUsername || 'Ciudadano'}:0`,
            team: 'Civilian',
            callsign: '',
            location: `Postal ${Math.round(ubi.lat)}, ${Math.round(ubi.lng)}`,
            personaje: personaje || undefined,
          })
          return
        }
      }
    } catch { /* ignorar fallback */ }
  }, [cleanUsername, personaje, user])

  useEffect(() => {
    fetchMap()
    const id = setInterval(fetchMap, 2000)
    return () => clearInterval(id)
  }, [fetchMap])

  // ─── Image load → compute minZoom ────────────────────────────────────
  const handleImgLoad = useCallback(() => {
    const img = imgRef.current
    const vp = viewportRef.current
    if (!img || !vp) return

    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    if (!imgW || !imgH) return

    setNaturalSize({ w: imgW, h: imgH })

    const vpW = vp.clientWidth
    const vpH = vp.clientHeight

    // "cover" zoom: image fills viewport completely, no background gaps
    const minZ = Math.max(vpW / imgW, vpH / imgH)
    setMinZoom(minZ)
    // Start 1.5× zoomed in from the minimum so the user can explore
    setZoom(Math.min(minZ * 1.5, 4.0))
    setPan({ x: 0, y: 0 })
  }, [])

  // When the map type changes the img src changes → wait for new onLoad
  const handleImgError = () => { /* silently ignore */ }

  // ─── Geometry helpers ────────────────────────────────────────────────
  const clampPan = useCallback(
    (p: { x: number; y: number }, z: number): { x: number; y: number } => {
      const vp = viewportRef.current
      if (!vp || !naturalSize) return { x: 0, y: 0 }
      const vpW = vp.clientWidth
      const vpH = vp.clientHeight
      // Half the "overflow" on each side at this zoom level
      const maxX = Math.max(0, (naturalSize.w * z - vpW) / 2)
      const maxY = Math.max(0, (naturalSize.h * z - vpH) / 2)
      return {
        x: Math.max(-maxX, Math.min(maxX, p.x)),
        y: Math.max(-maxY, Math.min(maxY, p.y)),
      }
    },
    [naturalSize],
  )

  // Re-clamp whenever zoom changes
  useEffect(() => {
    setPan((p) => clampPan(p, zoom))
  }, [zoom, clampPan])

  // ─── Pointer / touch handlers ────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    setPan(
      clampPan(
        {
          x: panStart.current.x + (e.clientX - dragStart.current.x),
          y: panStart.current.y + (e.clientY - dragStart.current.y),
        },
        zoom,
      ),
    )
  }
  const handleMouseUp = () => { isDragging.current = false }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    isDragging.current = true
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    panStart.current = { ...pan }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return
    setPan(
      clampPan(
        {
          x: panStart.current.x + (e.touches[0].clientX - dragStart.current.x),
          y: panStart.current.y + (e.touches[0].clientY - dragStart.current.y),
        },
        zoom,
      ),
    )
  }
  const handleTouchEnd = () => { isDragging.current = false }

  const handleWheel = (e: React.WheelEvent) => {
    setZoom((prev) => {
      const delta = e.deltaY < 0 ? 0.15 : -0.15
      return Math.min(4.0, Math.max(minZoom, prev + delta))
    })
  }

  // ─── Zoom controls ───────────────────────────────────────────────────
  const handleZoomIn = () => setZoom((p) => Math.min(4.0, p + 0.25))
  const handleZoomOut = () => setZoom((p) => Math.max(minZoom, p - 0.25))
  const handleRecenter = () => {
    setZoom(Math.min(minZoom * 1.5, 4.0))
    setPan({ x: 0, y: 0 })
  }

  // ─── Derived values ──────────────────────────────────────────────────
  const locationRaw = activePlayer?.location ?? ''
  const parsedLoc = formatLocationData(locationRaw)
  const coords = getMapCoordinates(locationRaw)
  const mapImgSrc =
    mapType === 'satellite'
      ? satelliteMap
      : mapType === 'dark'
        ? darkMap
        : streetMap

  // CSS transform: centres the canvas, then applies pan + scale.
  // "translate(-50%, -50%)" centres the element on its top/left anchor (50vw, 50vh).
  // Adding panX/panY on top allows panning from that centred position.
  const canvasTransform = `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`

  return (
    <div className={styles.app}>
      <StatusBar title="Mapa" light showBack onBack={() => navigate('/')} />

      {/* ── Map viewport ─────────────────────────────────────────────── */}
      <div
        ref={viewportRef}
        className={styles.mapViewport}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* mapCanvas is positioned at (50vw, 50vh) and centred via transform.
            The image renders at its natural pixel size; CSS transform handles scale.
            This avoids object-fit cropping entirely. */}
        <div
          className={styles.mapCanvas}
          style={{ transform: canvasTransform }}
        >
          <img
            ref={imgRef}
            src={mapImgSrc}
            alt="Mapa de los Ángeles"
            className={styles.mapImg}
            draggable={false}
            onLoad={handleImgLoad}
            onError={handleImgError}
          />

          {/* Blue dot pin */}
          <div
            className={styles.userPin}
            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
          >
            <div className={styles.pinLabel}>
              {personaje ? personaje.nombre : cleanUsername || 'Tú'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating controls ────────────────────────────────────────── */}
      <div className={styles.controlsGroup}>
        <button
          type="button"
          className={styles.modeToggleBtn}
          onClick={(e) => {
            e.stopPropagation()
            setMapType((p) => {
              if (p === 'street') return 'satellite'
              if (p === 'satellite') return 'dark'
              return 'street'
            })
          }}
        >
          {mapType === 'street' && '🗺️ Callejero'}
          {mapType === 'satellite' && '🛰️ Satélite'}
          {mapType === 'dark' && '🌙 Oscuro'}
        </button>

        <div className={styles.zoomControls}>
          <button type="button" className={styles.zoomBtn} title="Acercar"
            onClick={(e) => { e.stopPropagation(); handleZoomIn() }}>+</button>
          <button type="button" className={styles.zoomBtn} title="Alejar"
            onClick={(e) => { e.stopPropagation(); handleZoomOut() }}>−</button>
        </div>

        <button type="button" className={styles.recenterBtn} title="Centrar en mi personaje"
          onClick={(e) => { e.stopPropagation(); handleRecenter() }}>
          🎯
        </button>
      </div>

      {/* ── Bottom info card ─────────────────────────────────────────── */}
      <div className={styles.bottomCard}>
        <div className={styles.cardHeader}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatarSrc}
              alt={personaje?.nombre || cleanUsername}
              className={styles.avatarImg}
              onError={(e) => {
                const el = e.currentTarget
                if (!el.src.includes('unavatar.io')) {
                  el.src = `https://unavatar.io/roblox/${encodeURIComponent(cleanUsername || 'Roblox')}`
                }
              }}
            />
          </div>
          <div className={styles.playerMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className={styles.playerName}>
                {personaje ? personaje.nombre : activePlayer?.player || cleanUsername || 'Personaje Activo'}
              </span>
              {apiStatus === 'connected' && (
                <span className={styles.badgeLive}>● Ubicación Aproximada ({playerCount} jug.)</span>
              )}
              {apiStatus === 'error' && (
                <span style={{ fontSize: 11, background: 'rgba(255,59,48,0.2)', color: '#ff453a', padding: '2px 8px', borderRadius: 8, fontWeight: 600 }}>
                  ⚠️ Sin conexión ERLC
                </span>
              )}
            </div>
            <span className={styles.playerSub}>
              @{cleanUsername || activePlayer?.player || 'roblox'} · {activePlayer?.team || 'Civilian'}
            </span>
          </div>
        </div>

        {errorMessage && (
          <div style={{ fontSize: 12, color: '#ff453a', background: 'rgba(255, 59, 48, 0.12)', padding: '6px 10px', borderRadius: 10, border: '0.5px solid rgba(255, 59, 48, 0.3)' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className={styles.locationBox}>
          <div className={styles.locationTitle}>📍 {parsedLoc.calle}</div>
          <div className={styles.locationGrid}>
            <div className={styles.locationChip}>
              <span className={styles.chipLabel}>Calle / Zona</span>
              <span className={styles.chipValue}>{parsedLoc.calle}</span>
            </div>
            <div className={styles.locationChip}>
              <span className={styles.chipLabel}>Postal</span>
              <span className={styles.chipValue}>{parsedLoc.postal}</span>
            </div>
            <div className={styles.locationChip}>
              <span className={styles.chipLabel}>Edificio</span>
              <span className={styles.chipValue}>{parsedLoc.edificio}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
