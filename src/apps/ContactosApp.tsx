import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, getDiscordId, formatPhoneNumber } from '@/lib/supabase'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import type { Contacto } from '@/types/database'
import styles from './ContactosApp.module.css'

type View = 'list' | 'add'

interface FoundCharacter {
  nombre: string
  usuario_roblox: string | null
  avatarUrl?: string
}

interface ContactAvatarProps {
  name: string
  robloxUsername?: string | null
  avatarUrl?: string
  className?: string
}

function ContactAvatar({ name, robloxUsername, avatarUrl, className }: ContactAvatarProps) {
  const [hasError, setHasError] = useState(false)

  const cleanUser = robloxUsername ? robloxUsername.replace(/^@/, '').replace(/\s+/g, '').trim() : ''

  const primarySrc =
    avatarUrl ||
    (cleanUser
      ? `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanUser)}&width=150&height=150&format=png`
      : null)

  if (!hasError && primarySrc) {
    return (
      <img
        src={primarySrc}
        alt={name}
        className={className || styles.avatarImg}
        onError={() => setHasError(true)}
      />
    )
  }

  return <div className={styles.avatar}>{name[0]?.toUpperCase() || '?'}</div>
}

export function ContactosApp() {
  const navigate = useNavigate()
  const { personaje, user } = useAuth()
  const [view, setView] = useState<View>('list')
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefonoResto, setTelefonoResto] = useState('')

  // Map of contact phone or name -> personaje info (roblox username, avatar, etc.)
  const [personajesMap, setPersonajesMap] = useState<
    Record<string, { roblox?: string | null; avatarUrl?: string }>
  >({})

  // Live lookup character when adding contact
  const [foundPersonaje, setFoundPersonaje] = useState<FoundCharacter | null>(null)

  const loadContactos = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('contactos')
      .select('*')
      .order('nombre', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      const fetched = data ?? []
      setContactos(fetched)

      if (fetched.length > 0) {
        // Collect phone variants for batch lookup in personajes table
        const phoneVariants: string[] = []
        fetched.forEach((c) => {
          if (c.numero_telefono) {
            const raw = c.numero_telefono.replace(/\D/g, '')
            phoneVariants.push(c.numero_telefono)
            if (raw) phoneVariants.push(raw)
            if (raw.length === 7) phoneVariants.push(`213${raw}`)
            if (raw.length === 10 && raw.startsWith('213')) phoneVariants.push(raw.slice(3))
          }
        })

        const map: Record<string, { roblox?: string | null; avatarUrl?: string }> = {}

        // Query personajes by phone numbers
        const uniquePhones = Array.from(new Set(phoneVariants))
        if (uniquePhones.length > 0) {
          const { data: personajesData } = await supabase
            .from('personajes')
            .select('numero, usuario_roblox, nombre')
            .in('numero', uniquePhones)

          if (personajesData && personajesData.length > 0) {
            personajesData.forEach((p) => {
              if (p.usuario_roblox) {
                const entry = { roblox: p.usuario_roblox }
                if (p.numero) map[p.numero] = entry
                const raw = p.numero?.replace(/\D/g, '')
                if (raw) map[raw] = entry
              }
            })
          }
        }

        // Also query personajes by contact name for any unmapped contacts
        const unmappedNames = fetched
          .filter((c) => {
            const raw = c.numero_telefono?.replace(/\D/g, '')
            return !map[c.numero_telefono] && !map[raw]
          })
          .map((c) => c.nombre.trim())

        if (unmappedNames.length > 0) {
          const { data: pNamesData } = await supabase
            .from('personajes')
            .select('nombre, usuario_roblox')
            .in('nombre', unmappedNames)

          if (pNamesData) {
            pNamesData.forEach((p) => {
              if (p.usuario_roblox) {
                map[`name:${p.nombre.toLowerCase()}`] = { roblox: p.usuario_roblox }
              }
            })
          }
        }

        setPersonajesMap(map)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadContactos()
  }, [loadContactos])

  // Handle phone input change with auto-cleaning and formatting
  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/\D/g, '')

    // If user pasted a full number starting with 1213 or 213, extract remaining 7 digits
    if (cleaned.startsWith('1213') && cleaned.length >= 11) {
      cleaned = cleaned.slice(4)
    } else if (cleaned.startsWith('213') && cleaned.length >= 10) {
      cleaned = cleaned.slice(3)
    } else if (cleaned.startsWith('1') && cleaned.length >= 8) {
      cleaned = cleaned.slice(1)
    }

    const digits = cleaned.slice(0, 7)
    // Format display string: XXX-XXXX
    let formatted = digits
    if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
    }
    setTelefonoResto(formatted)
  }

  // Live lookup character when typing phone number or name
  useEffect(() => {
    const digits = telefonoResto.replace(/\D/g, '')
    if (digits.length === 7 || nombre.trim().length >= 3) {
      const fullNum = `213${digits}`
      let isSubscribed = true

      const runLookup = async () => {
        let charData: { nombre: string; usuario_roblox: string | null } | null = null

        if (digits.length === 7) {
          const { data: numRes } = await supabase
            .from('personajes')
            .select('nombre, usuario_roblox')
            .or(`numero.eq.${fullNum},numero.eq.${digits}`)
            .maybeSingle()
          charData = numRes
        }

        if (!charData && nombre.trim().length >= 3) {
          const { data: nameRes } = await supabase
            .from('personajes')
            .select('nombre, usuario_roblox')
            .ilike('nombre', `%${nombre.trim()}%`)
            .maybeSingle()
          charData = nameRes
        }

        if (!isSubscribed) return

        if (charData && charData.usuario_roblox) {
          const avatarUrl =
            (await getRobloxAvatarUrl(charData.usuario_roblox)) ||
            `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
              charData.usuario_roblox,
            )}&width=150&height=150&format=png`

          if (isSubscribed) {
            setFoundPersonaje({
              nombre: charData.nombre,
              usuario_roblox: charData.usuario_roblox,
              avatarUrl,
            })
            if (!nombre.trim()) {
              setNombre(charData.nombre)
            }
          }
        } else {
          setFoundPersonaje(null)
        }
      }

      runLookup()

      return () => {
        isSubscribed = false
      }
    } else {
      setFoundPersonaje(null)
    }
  }, [telefonoResto, nombre])

  const handleAdd = async () => {
    const rawDigits = telefonoResto.replace(/\D/g, '')
    if (!nombre.trim() || rawDigits.length !== 7) {
      setError('Nombre y teléfono (7 dígitos) son obligatorios')
      return
    }
    setError(null)

    const fullTelefono = `213${rawDigits}`

    const discordId =
      personaje?.discord_id || (await getDiscordId()) || user?.user_metadata?.provider_id || user?.id

    if (!discordId) {
      setError('No se pudo identificar tu cuenta de Discord')
      return
    }

    const { error: err } = await supabase.from('contactos').insert({
      discord_id: discordId,
      numero_telefono: fullTelefono,
      nombre: nombre.trim(),
    })

    if (err) {
      setError(err.message)
    } else {
      setNombre('')
      setTelefonoResto('')
      setFoundPersonaje(null)
      setView('list')
      loadContactos()
    }
  }

  const handleDelete = async (id: number) => {
    const { error: err } = await supabase.from('contactos').delete().eq('id', id)
    if (err) setError(err.message)
    else loadContactos()
  }

  return (
    <div className={styles.app}>
      <StatusBar
        title={view === 'list' ? 'Contactos' : 'Nuevo contacto'}
        showBack
        onBack={() => {
          if (view === 'list') navigate('/')
          else setView('list')
        }}
        rightAction={
          view === 'list' ? (
            <button
              style={{ fontSize: 24, color: 'var(--accent)', lineHeight: 1 }}
              onClick={() => setView('add')}
            >
              +
            </button>
          ) : undefined
        }
      />
      <div className={`${styles.content} app-scroll`}>
        {error && <p className={styles.error}>{error}</p>}

        {view === 'list' && (
          <>
            {loading ? (
              <div className="empty-state">
                <div className="loading-spinner" />
              </div>
            ) : contactos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">👤</span>
                <p>Sin contactos</p>
                <button className="ios-btn ios-btn-primary" onClick={() => setView('add')}>
                  Añadir contacto
                </button>
              </div>
            ) : (
              <div className="ios-list fade-in">
                {contactos.map((c) => {
                  const rawNum = c.numero_telefono?.replace(/\D/g, '') || ''
                  const pInfo =
                    personajesMap[c.numero_telefono] ||
                    personajesMap[rawNum] ||
                    personajesMap[`name:${c.nombre.toLowerCase()}`]

                  return (
                    <div key={c.id} className="ios-list-item">
                      <ContactAvatar
                        name={c.nombre}
                        robloxUsername={pInfo?.roblox}
                        avatarUrl={pInfo?.avatarUrl}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {formatPhoneNumber(c.numero_telefono)}
                        </div>
                      </div>
                      <button
                        style={{ color: 'var(--accent-red)', fontSize: 13 }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {view === 'add' && (
          <div className={`${styles.form} fade-in`}>
            <label className="ios-label">Nombre del contacto</label>
            <input
              className="ios-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: John Doe"
              style={{ marginBottom: 12 }}
            />

            <label className="ios-label">Teléfono</label>
            <div className={styles.phoneInputWrapper}>
              <span className={styles.phonePrefix}>+1 (213)</span>
              <input
                className={styles.phoneInput}
                type="tel"
                value={telefonoResto}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="555-0123"
                maxLength={8}
              />
            </div>

            {foundPersonaje && (
              <div className={styles.foundCard}>
                <ContactAvatar
                  name={foundPersonaje.nombre}
                  robloxUsername={foundPersonaje.usuario_roblox}
                  avatarUrl={foundPersonaje.avatarUrl}
                  className={styles.foundAvatar}
                />
                <div className={styles.foundInfo}>
                  <div className={styles.foundName}>{foundPersonaje.nombre}</div>
                  {foundPersonaje.usuario_roblox && (
                    <div className={styles.foundRoblox}>@{foundPersonaje.usuario_roblox}</div>
                  )}
                </div>
                {nombre !== foundPersonaje.nombre && (
                  <button
                    type="button"
                    className={styles.useNameBtn}
                    onClick={() => setNombre(foundPersonaje.nombre)}
                  >
                    Usar nombre
                  </button>
                )}
              </div>
            )}

            <button className="ios-btn ios-btn-primary" onClick={handleAdd}>
              Guardar contacto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
