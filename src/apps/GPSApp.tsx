import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, getDiscordId } from '@/lib/supabase'
import type { Contacto, GpsCompartido, Ubicacion } from '@/types/database'
import styles from './GPSApp.module.css'

export function GPSApp() {
  const navigate = useNavigate()
  const { personaje, user } = useAuth()
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [compartidos, setCompartidos] = useState<GpsCompartido[]>([])
  const [ubicacionesRecibidas, setUbicacionesRecibidas] = useState<
    (Ubicacion & { contactoNombre?: string })[]
  >([])
  const [miUbicacion, setMiUbicacion] = useState<Ubicacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const discordId = personaje?.discord_id || (await getDiscordId()) || user?.user_metadata?.provider_id || user?.id

    if (!discordId) {
      setLoading(false)
      return
    }

    const [contactosRes, compartidosRes, ubicacionRes] = await Promise.all([
      supabase.from('contactos').select('*').order('nombre_guardado'),
      supabase.from('gps_compartido').select('*').eq('discord_id_emisor', discordId),
      supabase.from('ubicaciones').select('*').eq('discord_id', discordId).maybeSingle(),
    ])

    setContactos(contactosRes.data ?? [])
    setCompartidos(compartidosRes.data ?? [])
    setMiUbicacion(ubicacionRes.data)

    if (ubicacionRes.data) {
      setLat(String(ubicacionRes.data.lat))
      setLng(String(ubicacionRes.data.lng))
    }

    const { data: recGps } = await supabase
      .from('gps_compartido')
      .select('*')
      .eq('discord_id_receptor', discordId)
      .eq('activo', true)

    if (recGps && recGps.length > 0) {
      const emisores = recGps.map((g) => g.discord_id_emisor)
      const { data: ubis } = await supabase
        .from('ubicaciones')
        .select('*')
        .in('discord_id', emisores)

      const { data: emisorPersonajes } = await supabase
        .from('personajes')
        .select('discord_id, nombre')
        .in('discord_id', emisores)

      const nombreMap = new Map<string, string>()
      emisorPersonajes?.forEach((p) => nombreMap.set(p.discord_id, p.nombre))

      setUbicacionesRecibidas(
        (ubis ?? []).map((u) => ({
          ...u,
          contactoNombre: nombreMap.get(u.discord_id) ?? 'Contacto',
        })),
      )
    }

    setLoading(false)
  }, [personaje, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isSharingWith = (receptorDiscordId: string) =>
    compartidos.some((g) => g.discord_id_receptor === receptorDiscordId && g.activo)

  const toggleShare = async (receptorDiscordId: string) => {
    setError(null)
    setSuccess(null)

    const discordId = personaje?.discord_id || (await getDiscordId()) || user?.user_metadata?.provider_id || user?.id
    if (!discordId) return

    const existing = compartidos.find((g) => g.discord_id_receptor === receptorDiscordId)

    if (existing) {
      const { error: err } = await supabase
        .from('gps_compartido')
        .update({ activo: !existing.activo })
        .eq('id', existing.id)

      if (err) setError(err.message)
      else {
        setSuccess(existing.activo ? 'Ubicación oculta' : 'Ubicación compartida')
        loadData()
      }
    } else {
      const { error: err } = await supabase
        .from('gps_compartido')
        .insert({ discord_id_emisor: discordId, discord_id_receptor: receptorDiscordId, activo: true })

      if (err) setError(err.message)
      else {
        setSuccess('Ubicación compartida')
        loadData()
      }
    }
  }

  const updateMyLocation = async () => {
    setError(null)
    setSuccess(null)

    const discordId = personaje?.discord_id || (await getDiscordId()) || user?.user_metadata?.provider_id || user?.id
    if (!discordId) return

    const nLat = parseFloat(lat)
    const nLng = parseFloat(lng)

    if (isNaN(nLat) || isNaN(nLng)) {
      setError('Latitud y longitud deben ser numéricas')
      return
    }

    const payload = {
      discord_id: discordId,
      lat: nLat,
      lng: nLng,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = miUbicacion
      ? await supabase.from('ubicaciones').update({ lat: nLat, lng: nLng, updated_at: new Date().toISOString() }).eq('discord_id', discordId)
      : await supabase.from('ubicaciones').insert(payload)

    if (err) setError(err.message)
    else {
      setSuccess('Ubicación actualizada')
      loadData()
    }
  }

  return (
    <div className={styles.app}>
      <StatusBar title="GPS" showBack onBack={() => navigate('/')} />
      <div className={`${styles.content} app-scroll`}>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        {loading ? (
          <div className="empty-state"><div className="loading-spinner" /></div>
        ) : (
          <div className="fade-in">
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Mi ubicación</h3>
              <div className={styles.row}>
                <div style={{ flex: 1 }}>
                  <label className="ios-label">Latitud</label>
                  <input
                    className="ios-input"
                    type="number"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ios-label">Longitud</label>
                  <input
                    className="ios-input"
                    type="number"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <button
                className="ios-btn ios-btn-primary"
                style={{ marginTop: 12 }}
                onClick={updateMyLocation}
              >
                Actualizar ubicación
              </button>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Compartir con contactos</h3>
              {contactos.length === 0 ? (
                <p className={styles.hint}>Añade contactos primero</p>
              ) : (
                <div className="ios-list">
                  {contactos.map((c) => (
                    <div key={c.id} className="ios-list-item">
                      <span>{c.nombre}</span>
                      <button
                        className={`${styles.toggle} ${isSharingWith(c.discord_id) ? styles.active : ''}`}
                        onClick={() => toggleShare(c.discord_id)}
                      >
                        {isSharingWith(c.discord_id) ? 'Compartiendo' : 'Compartir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {ubicacionesRecibidas.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Ubicaciones recibidas</h3>
                <div className="ios-list">
                  {ubicacionesRecibidas.map((u) => (
                    <div key={u.discord_id} className="ios-list-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {u.contactoNombre ?? 'Contacto'}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--accent-teal)' }}>
                          📍 Lat: {u.lat}, Lng: {u.lng}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                          Actualizado: {new Date(u.updated_at).toLocaleTimeString('es-ES')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
