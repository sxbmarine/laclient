import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { StatusBar } from '@/components/StatusBar'
import { formatPhoneNumber } from '@/lib/supabase'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import styles from './DNIeApp.module.css'

export function DNIeApp() {
  const navigate = useNavigate()
  const { personaje } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const formatDate = (date?: string | null) => {
    if (!date) return 'N/A'
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return date
    }
  }

  const cleanUsername = (personaje?.usuario_roblox || '')
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .trim()

  useEffect(() => {
    const targetName = cleanUsername || 'Roblox'
    const initialUrl = `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
      targetName,
    )}&width=420&height=420&format=png`
    setAvatarUrl(initialUrl)

    let isMounted = true
    getRobloxAvatarUrl(targetName).then((url) => {
      if (isMounted && url) {
        setAvatarUrl(url)
      }
    })

    return () => {
      isMounted = false
    }
  }, [cleanUsername])

  const avatarSrc =
    avatarUrl ||
    `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
      cleanUsername || 'Roblox',
    )}&width=420&height=420&format=png`

  return (
    <div className={styles.app}>
      <StatusBar light title="DMV" showBack onBack={() => navigate('/')} />

      {!personaje ? (
        <div className={`${styles.content} app-scroll`}>
          <div className="empty-state">
            <span className="empty-state-icon">🪪</span>
            <p>No tienes un personaje activo</p>
            <p style={{ fontSize: 14 }}>
              Reinicia el teléfono o vuelve a conectar tu cuenta de Discord
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          {/* Header rosa estilo referencia */}
          <div className={styles.pinkHeader}>
            <h1 className={styles.welcomeText}>Bienvenido,</h1>
            <h2 className={styles.nameTitle}>{personaje.nombre?.toUpperCase()}</h2>
            <p className={styles.subtitleText}>Documentación para compartir en persona</p>
          </div>

          {/* Tarjeta negra estilo liquid glass dock */}
          <div className={styles.blackGlassCard}>
            <div className={styles.glassShine} />

            <div className={styles.activeBadge}>
              <span>✓ Active</span>
            </div>

            <div className={styles.cardMain}>
              <div className={styles.avatarWrapper}>
                <img
                  src={avatarSrc}
                  alt={personaje.nombre}
                  className={styles.avatarImg}
                  onError={(e) => {
                    const el = e.currentTarget
                    const fallback = `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanUsername || 'Roblox')}&width=420&height=420&format=png`
                    if (el.src !== fallback) {
                      el.src = fallback
                    }
                  }}
                />
              </div>

              <div className={styles.cardDetails}>
                <h3 className={styles.cardName}>{personaje.nombre?.toUpperCase()}</h3>
                <p className={styles.cardDocType}>Los Ángeles CC/DNI Móvil</p>
                <div className={styles.issuedBlock}>
                  <span className={styles.issuedLabel}>Emitido por</span>
                  <span className={styles.issuedVal}>Los Ángeles DMV</span>
                </div>
              </div>
            </div>

            <button
              className={styles.showIdBtn}
              onClick={() => setShowModal(true)}
            >
              Mostrar carné de conducir / DNI
            </button>
          </div>
        </div>
      )}

      {/* Sheet Modal con la tarjeta mDL rosa calcada de la referencia */}
      {showModal && personaje && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.walletTitle}>CARTERA LOS ÁNGELES DMV</div>

          <div
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón X de cerrar */}
            <button
              className={styles.closeBtn}
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            {/* Tarjeta mDL Info en rosa */}
            <div className={styles.pinkMdlCard}>
              <div className={styles.pinkCardTop}>
                <div className={styles.mdlBadge}>
                  <span className={styles.mdlText}>mDL</span>
                </div>
                <div className={styles.statusBlock}>
                  <span className={styles.statusLabel}>Estado</span>
                  <span className={styles.statusVal}>Activo</span>
                </div>
              </div>

              <div className={styles.mdlTitle}>Identificación mDL</div>

              <div className={styles.pinkGrid}>
                <div className={styles.pinkGridCol}>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Emitido por</span>
                    <span className={styles.pinkVal}>Los Ángeles DMV</span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Identificador</span>
                    <span className={styles.pinkVal}>
                      {personaje.idnumber || 'A1234567'}
                    </span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Teléfono</span>
                    <span className={styles.pinkVal}>
                      {formatPhoneNumber(personaje.numero)}
                    </span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Roblox</span>
                    <span className={styles.pinkVal}>
                      @{personaje.usuario_roblox || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className={styles.pinkGridCol}>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Fuente de Datos</span>
                    <span className={styles.pinkVal}>DMV</span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Fecha de nacimiento</span>
                    <span className={styles.pinkVal}>
                      {formatDate(personaje.fecha_nacimiento)}
                    </span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Género</span>
                    <span className={styles.pinkVal}>
                      {personaje.genero || 'N/A'}
                    </span>
                  </div>
                  <div className={styles.pinkField}>
                    <span className={styles.pinkLabel}>Dirección</span>
                    <span className={styles.pinkVal}>
                      {personaje.domicilio || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar + Name Block */}
              <div className={styles.pinkAvatarBlock}>
                <div className={styles.pinkAvatarWrapper}>
                  <img
                    src={avatarSrc}
                    alt={personaje.nombre}
                    className={styles.pinkAvatarImg}
                    onError={(e) => {
                      const el = e.currentTarget
                      const fallback = `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanUsername || 'Roblox')}&width=420&height=420&format=png`
                      if (el.src !== fallback) {
                        el.src = fallback
                      }
                    }}
                  />
                </div>
                <div className={styles.pinkNameBlock}>
                  <span className={styles.pinkNameLabel}>Name</span>
                  <span className={styles.pinkNameVal}>{personaje.nombre}</span>
                </div>
              </div>

              <div className={styles.pinkFooterHint}>
                Desliza para Código QR »
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
