import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, getDiscordId, formatPhoneNumber } from '@/lib/supabase'
import type { Contacto, Mensaje } from '@/types/database'
import styles from './MensajesApp.module.css'

type View = 'contacts' | 'chat'

interface ContactAvatarProps {
  name: string
  robloxUsername?: string | null
  className?: string
}

function ContactAvatar({ name, robloxUsername, className }: ContactAvatarProps) {
  const [imgState, setImgState] = useState<'primary' | 'unavatar' | 'letter'>('primary')

  const cleanUser = robloxUsername
    ? robloxUsername.replace(/^@/, '').replace(/\s+/g, '').trim()
    : (name || '').replace(/^@/, '').replace(/\s+/g, '').trim()

  const primarySrc = cleanUser
    ? `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanUser)}&width=150&height=150&format=png`
    : null

  const unavatarSrc = cleanUser ? `https://unavatar.io/roblox/${encodeURIComponent(cleanUser)}` : null

  if (imgState === 'primary' && primarySrc) {
    return (
      <img
        src={primarySrc}
        alt={name}
        className={className || styles.avatarImg}
        onError={() => {
          if (unavatarSrc) setImgState('unavatar')
          else setImgState('letter')
        }}
      />
    )
  }

  if (imgState === 'unavatar' && unavatarSrc) {
    return (
      <img
        src={unavatarSrc}
        alt={name}
        className={className || styles.avatarImg}
        onError={() => setImgState('letter')}
      />
    )
  }

  return (
    <div className={className ? `${styles.avatar} ${className}` : styles.avatar}>
      {name[0]?.toUpperCase() || '?'}
    </div>
  )
}

function formatMessageTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffHours < 48) {
    return 'Ayer'
  }
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

export function MensajesApp() {
  const navigate = useNavigate()
  const { personaje } = useAuth()
  const [view, setView] = useState<View>('contacts')
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [selectedContact, setSelectedContact] = useState<Contacto | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [discordId, setDiscordId] = useState<string | null>(null)
  const [personajesMap, setPersonajesMap] = useState<
    Record<string, { roblox?: string | null; discord_id?: string | null }>
  >({})
  const [lastMessagesMap, setLastMessagesMap] = useState<
    Record<string, { contenido: string; created_at: string }>
  >({})

  const chatAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getDiscordId().then(setDiscordId)
  }, [])

  const loadContactos = useCallback(async () => {
    setLoading(true)
    const currentDiscordId = discordId || personaje?.discord_id || (await getDiscordId())

    // 1. Fetch REAL contacts from Supabase 'contactos' table
    const { data: contactsData } = await supabase
      .from('contactos')
      .select('*')
      .order('nombre', { ascending: true })

    const fetchedContacts = contactsData ?? []

    // 2. Query personajes & usuarios to resolve exact Roblox headshots
    const [personajesRes, usuariosRes] = await Promise.all([
      supabase.from('personajes').select('numero, usuario_roblox, nombre, discord_id'),
      supabase.from('usuarios').select('discord_id, roblox'),
    ])

    const userRobloxMap: Record<string, string> = {}
    usuariosRes.data?.forEach((u) => {
      if (u.discord_id && u.roblox) {
        userRobloxMap[u.discord_id] = u.roblox
      }
    })

    const pMap: Record<string, { roblox?: string | null; discord_id?: string | null }> = {}
    personajesRes.data?.forEach((p) => {
      const robloxUser = p.usuario_roblox || (p.discord_id ? userRobloxMap[p.discord_id] : null)
      const entry = { roblox: robloxUser, discord_id: p.discord_id }

      if (p.numero) {
        pMap[p.numero] = entry
        const raw = p.numero.replace(/\D/g, '')
        if (raw) pMap[raw] = entry
      }
      if (p.nombre) {
        pMap[`name:${p.nombre.toLowerCase().trim()}`] = entry
      }
      if (p.discord_id) {
        pMap[`discord:${p.discord_id}`] = entry
      }
    })

    // 3. Fetch LATEST message for each conversation
    const msgMap: Record<string, { contenido: string; created_at: string }> = {}

    if (currentDiscordId) {
      const { data: allMessages } = await supabase
        .from('mensajes')
        .select('*')
        .or(`emisor_discord_id.eq.${currentDiscordId},receptor_discord_id.eq.${currentDiscordId}`)
        .order('created_at', { ascending: false })

      if (allMessages) {
        allMessages.forEach((msg) => {
          const otherDiscordId =
            msg.emisor_discord_id === currentDiscordId
              ? msg.receptor_discord_id
              : msg.emisor_discord_id

          if (otherDiscordId && !msgMap[otherDiscordId]) {
            msgMap[otherDiscordId] = {
              contenido: msg.contenido,
              created_at: msg.created_at,
            }
          }
        })
      }
    }

    setPersonajesMap(pMap)
    setLastMessagesMap(msgMap)
    setContactos(fetchedContacts)
    setLoading(false)
  }, [discordId, personaje])

  const loadMensajes = useCallback(
    async (contact: Contacto) => {
      const currentDiscordId = discordId || personaje?.discord_id || (await getDiscordId())
      if (!currentDiscordId) return

      const rawNum = contact.numero_telefono?.replace(/\D/g, '') || ''

      const { data: recipientChar } = await supabase
        .from('personajes')
        .select('discord_id')
        .or(`numero.eq.${contact.numero_telefono},numero.eq.${rawNum}`)
        .maybeSingle()

      let recipientDiscordId = recipientChar?.discord_id

      if (!recipientDiscordId) {
        const { data: charByName } = await supabase
          .from('personajes')
          .select('discord_id')
          .eq('nombre', contact.nombre)
          .maybeSingle()
        recipientDiscordId = charByName?.discord_id
      }

      let queryStr = `emisor_discord_id.eq.${currentDiscordId}`
      if (recipientDiscordId) {
        queryStr = `and(emisor_discord_id.eq.${currentDiscordId},receptor_discord_id.eq.${recipientDiscordId}),and(emisor_discord_id.eq.${recipientDiscordId},receptor_discord_id.eq.${currentDiscordId})`
      }

      const { data } = await supabase
        .from('mensajes')
        .select('*')
        .or(queryStr)
        .order('created_at', { ascending: true })

      setMensajes(data ?? [])
    },
    [personaje, discordId],
  )

  useEffect(() => {
    loadContactos()
  }, [loadContactos])

  useEffect(() => {
    if (!selectedContact) return

    loadMensajes(selectedContact)

    const channel = supabase
      .channel(`mensajes-chat`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        () => {
          loadMensajes(selectedContact)
          loadContactos()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedContact, loadMensajes, loadContactos])

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
    }
  }, [mensajes])

  const handleSend = async () => {
    if (!nuevoMensaje.trim() || !selectedContact) return

    const currentDiscordId = discordId || personaje?.discord_id || (await getDiscordId())
    if (!currentDiscordId) return

    const rawNum = selectedContact.numero_telefono?.replace(/\D/g, '') || ''

    const { data: recipientChar } = await supabase
      .from('personajes')
      .select('discord_id')
      .or(`numero.eq.${selectedContact.numero_telefono},numero.eq.${rawNum}`)
      .maybeSingle()

    let recipientDiscordId = recipientChar?.discord_id

    if (!recipientDiscordId) {
      const { data: charByName } = await supabase
        .from('personajes')
        .select('discord_id')
        .eq('nombre', selectedContact.nombre)
        .maybeSingle()
      recipientDiscordId = charByName?.discord_id
    }

    if (!recipientDiscordId) {
      console.error('Destinatario no encontrado')
      return
    }

    const { error } = await supabase.from('mensajes').insert({
      emisor_discord_id: currentDiscordId,
      receptor_discord_id: recipientDiscordId,
      contenido: nuevoMensaje.trim(),
    })

    if (!error) {
      setNuevoMensaje('')
      loadMensajes(selectedContact)
      loadContactos()
    }
  }

  const openChat = (contact: Contacto) => {
    setSelectedContact(contact)
    setView('chat')
  }

  const filteredContactos = contactos.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return c.nombre.toLowerCase().includes(q) || c.numero_telefono.includes(q)
  })

  const selectedContactPInfo = selectedContact
    ? personajesMap[selectedContact.numero_telefono] ||
      personajesMap[selectedContact.numero_telefono.replace(/\D/g, '')] ||
      personajesMap[`name:${selectedContact.nombre.toLowerCase().trim()}`]
    : null

  return (
    <div className={styles.app}>
      <StatusBar />

      {view === 'contacts' ? (
        <>
          {/* Top Bar Navigation */}
          <div className={styles.topNavHeader}>
            <button className={styles.editBtn} onClick={() => navigate('/')}>
              Editar
            </button>
            <button className={styles.filterBtn} title="Filtros">
              <span>☰</span>
            </button>
          </div>

          {/* Large Title */}
          <div className={styles.largeTitleContainer}>
            <h1 className={styles.largeTitle}>Mensajes</h1>
          </div>

          {/* Main Real Contacts & Last Messages List */}
          <div className={styles.body}>
            <div className={`${styles.content} app-scroll`}>
              {loading ? (
                <div className="empty-state">
                  <div className="loading-spinner" />
                </div>
              ) : filteredContactos.length === 0 ? (
                <div className="empty-state" style={{ paddingTop: '60px', textAlign: 'center', color: '#8e8e93' }}>
                  <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>💬</span>
                  <p style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>No hay contactos o mensajes</p>
                  <p style={{ fontSize: '14px', marginTop: '4px' }}>Añade un contacto para comenzar a chatear</p>
                </div>
              ) : (
                filteredContactos.map((c) => {
                  const rawNum = c.numero_telefono?.replace(/\D/g, '') || ''
                  const pInfo =
                    personajesMap[c.numero_telefono] ||
                    personajesMap[rawNum] ||
                    personajesMap[`name:${c.nombre.toLowerCase().trim()}`]

                  const contactDiscordId = pInfo?.discord_id
                  const lastMsg = contactDiscordId ? lastMessagesMap[contactDiscordId] : null

                  const timeText = formatMessageTime(lastMsg?.created_at)
                  const previewText = lastMsg?.contenido || formatPhoneNumber(c.numero_telefono)

                  return (
                    <div
                      key={c.id}
                      className={styles.messageRow}
                      onClick={() => openChat(c)}
                    >
                      {/* Contact Avatar (Roblox Headshot) */}
                      <div className={styles.avatarWrapper}>
                        <ContactAvatar
                          name={c.nombre}
                          robloxUsername={pInfo?.roblox || c.nombre}
                        />
                      </div>

                      {/* Content & Metadata */}
                      <div className={styles.rowContent}>
                        <div className={styles.rowHeader}>
                          <span className={styles.contactName}>{c.nombre}</span>
                          <div className={styles.rowMeta}>
                            <span className={styles.timeText}>{timeText}</span>
                            <span className={styles.chevron}>›</span>
                          </div>
                        </div>

                        {/* Last Message Content */}
                        <div className={styles.rowSubtext}>
                          <span className={styles.previewText}>{previewText}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Floating Glassmorphic Search Bar & New Message Button */}
            <div className={styles.floatingBottomBar}>
              <div className={styles.searchPill}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.micIcon}>🎙️</span>
              </div>
              <button
                className={styles.composeBtn}
                onClick={() => navigate('/contactos')}
                title="Nuevo mensaje"
              >
                ✏️
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Active Chat View */
        <>
          <div className={styles.chatNavHeader}>
            <button
              className={styles.chatBackBtn}
              onClick={() => {
                setView('contacts')
                setSelectedContact(null)
              }}
              title="Atrás"
            >
              ‹
            </button>
            {selectedContact && (
              <div className={styles.chatHeaderCenter}>
                <ContactAvatar
                  name={selectedContact.nombre}
                  robloxUsername={selectedContactPInfo?.roblox || selectedContact.nombre}
                  className={styles.chatHeaderAvatar}
                />
                <div className={styles.chatHeaderNamePill}>
                  {selectedContact.nombre} <span>›</span>
                </div>
                <div className={styles.chatHeaderSubtitle}>
                  Mensaje de texto • SMS
                </div>
              </div>
            )}
          </div>

          <div className={styles.body}>
            <div ref={chatAreaRef} className={`${styles.chatArea} app-scroll`}>
              {mensajes.length === 0 ? (
                <div className="empty-state" style={{ paddingTop: '40px', textAlign: 'center', color: '#8e8e93' }}>
                  <p>Inicia la conversación enviando un mensaje</p>
                </div>
              ) : (
                mensajes.map((m) => {
                  const isMine = m.emisor_discord_id === (discordId || personaje?.discord_id)
                  return (
                    <div
                      key={m.id}
                      className={`${styles.bubbleRow} ${isMine ? styles.rowMine : styles.rowTheirs}`}
                    >
                      <div className={`${styles.bubble} ${isMine ? styles.mine : styles.theirs}`}>
                        <p>{m.contenido}</p>
                        <span className={styles.time}>
                          {new Date(m.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className={styles.inputBarWrapper}>
              <button className={styles.plusBtn} type="button" title="Añadir">
                +
              </button>
              <div className={styles.inputCapsule}>
                <input
                  className={styles.chatInput}
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Mensaje"
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button className={styles.sendBtn} onClick={handleSend} type="button" title="Enviar">
                  ↑
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MensajesApp
