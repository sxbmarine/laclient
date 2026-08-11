import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import { supabase } from '@/lib/supabase'
import { IosToggle } from '@/components/ui/IosToggle'
import { IosSlider } from '@/components/ui/IosSlider'

import wallDefault from '@/assets/backgrounds/homescreen/default.png'
import wall1 from '@/assets/backgrounds/homescreen/bankbg1.webp'
import wall2 from '@/assets/backgrounds/homescreen/bankbg2.jpg'
import wall3 from '@/assets/backgrounds/homescreen/bankbg3.jpg'
import wall4 from '@/assets/backgrounds/homescreen/bankbg4.jpg'
import wall5 from '@/assets/backgrounds/homescreen/bosque.avif'
import wall6 from '@/assets/backgrounds/homescreen/flores.webp'
import wall7 from '@/assets/backgrounds/homescreen/montaña.png'

import styles from './AjustesApp.module.css'

type SubView = 'main' | 'wallpaper' | 'apariencia' | 'notificaciones' | 'sonido' | 'telefono' | 'general'

const HOMESCREEN_WALLPAPERS = [
  { id: 'default', name: 'Predeterminado', src: wallDefault },
  { id: 'banco1', name: 'Cascada neon', src: wall1 },
  { id: 'banco2', name: 'Burbujas neon', src: wall2 },
  { id: 'banco3', name: 'Metal y Cristal', src: wall3 },
  { id: 'banco4', name: 'Cristal', src: wall4 },
  { id: 'banco5', name: 'Bosque', src: wall5 },
  { id: 'banco6', name: 'Flores', src: wall6 },
  { id: 'banco7', name: 'Montaña', src: wall7 },
]

export function AjustesApp() {
  const navigate = useNavigate()
  const { personaje, user, logout } = useAuth()

  const [subview, setSubview] = useState<SubView>('main')

  // Settings State
  const [selectedWallIndex, setSelectedWallIndex] = useState<number>(() => {
    const saved = localStorage.getItem('homescreen_bg_index')
    return saved ? parseInt(saved, 10) : 0
  })

  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notif_enabled')
    return saved !== null ? saved === 'true' : true
  })

  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem('sound_muted')
    return saved !== null ? saved === 'true' : false
  })

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    const saved = localStorage.getItem('sound_volume')
    return saved !== null ? parseInt(saved, 10) : 80
  })

  const [contactosCount, setContactosCount] = useState<number>(0)
  const [showResetModal, setShowResetModal] = useState<boolean>(false)

  // Fetch count of contacts
  useEffect(() => {
    const fetchContactosCount = async () => {
      if (!personaje) return
      try {
        const { count } = await supabase
          .from('contactos')
          .select('*', { count: 'exact', head: true })
          .eq('discord_id', personaje.discord_id)

        if (count !== null) setContactosCount(count)
      } catch {
        /* ignore */
      }
    }
    fetchContactosCount()
  }, [personaje])

  // Wallpaper change handler
  const handleSelectWallpaper = (index: number) => {
    setSelectedWallIndex(index)
    localStorage.setItem('homescreen_bg_index', index.toString())
    localStorage.setItem('homescreen_wallpaper', HOMESCREEN_WALLPAPERS[index].src)
    window.dispatchEvent(new CustomEvent('wallpaper:change', { detail: HOMESCREEN_WALLPAPERS[index].src }))
  }

  // Toggle notification handler
  const handleToggleNotif = (enabled: boolean) => {
    setNotifEnabled(enabled)
    localStorage.setItem('notif_enabled', enabled ? 'true' : 'false')
  }

  // Toggle mute handler
  const handleToggleMute = (muted: boolean) => {
    setSoundMuted(muted)
    localStorage.setItem('sound_muted', muted ? 'true' : 'false')
  }

  // Volume slider handler
  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol)
    localStorage.setItem('sound_volume', vol.toString())
  }

  // Logout handler
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Reset iPhone handler
  const handleResetConfirm = async () => {
    localStorage.clear()
    sessionStorage.clear()
    setShowResetModal(false)
    await logout()
    navigate('/')
  }

  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Resolve Roblox avatar URL async
  useEffect(() => {
    let isMounted = true
    const resolveAvatar = async () => {
      if (personaje?.usuario_roblox) {
        try {
          const url = await getRobloxAvatarUrl(personaje.usuario_roblox)
          if (isMounted && url) {
            setAvatarUrl(url)
            return
          }
        } catch {
          /* ignore */
        }
      }
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url)
        return
      }
      const fallback = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(personaje?.nombre || 'user')}`
      if (isMounted) setAvatarUrl(fallback)
    }
    resolveAvatar()
    return () => {
      isMounted = false
    }
  }, [personaje, user])

  // Render Subview Header Navigation Bar
  const renderNavHeader = (titleText: string) => (
    <div className={styles.navBar}>
      <button className={styles.backBtn} onClick={() => setSubview('main')}>
        ‹ Ajustes
      </button>
      <span className={styles.subTitleNav}>{titleText}</span>
      <div style={{ width: 60 }} />
    </div>
  )

  // 1. MAIN SETTINGS SCREEN (Matching iOS Screenshot)
  if (subview === 'main') {
    return (
      <div className={styles.container}>
        <StatusBar />
        <div className={styles.content}>
          <h1 className={styles.largeTitle}>Ajustes</h1>

          {/* User Profile Card */}
          <div className={styles.profileCard} onClick={() => navigate('/dnie')}>
            <img
              src={avatarUrl}
              alt="Avatar"
              className={styles.avatar}
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(personaje?.nombre || 'user')}`
              }}
            />
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>
                {personaje?.nombre || user?.user_metadata?.custom_claims?.global_name || 'Usuario'}
              </span>
              <span className={styles.profileSub}>Cuenta de Apple, iCloud+, y más</span>
            </div>
            <span className={styles.chevron}>›</span>
          </div>

          {/* Group 1: Main App Settings */}
          <div className={styles.group}>
            <div className={styles.rowItem} onClick={() => setSubview('wallpaper')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#FF9500' }}>
                  <span className={styles.iconEmoji}></span>
                </div>
                <span className={styles.rowLabel}>Fondo de Pantalla</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowValue}>{HOMESCREEN_WALLPAPERS[selectedWallIndex]?.name}</span>
                <span className={styles.chevron}>›</span>
              </div>
            </div>

            <div className={styles.rowItem} onClick={() => setSubview('apariencia')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#5856D6' }}>
                  <span className={styles.iconEmoji}>󰏘</span>
                </div>
                <span className={styles.rowLabel}>Apariencia</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowValue}>Marco</span>
                <span className={styles.chevron}>›</span>
              </div>
            </div>

            <div className={styles.rowItem} onClick={() => setSubview('notificaciones')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#007AFF' }}>
                  <span className={styles.iconEmoji}></span>
                </div>
                <span className={styles.rowLabel}>Notificaciones</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowValue}>{notifEnabled ? 'Activadas' : 'Desactivadas'}</span>
                <span className={styles.chevron}>›</span>
              </div>
            </div>

            <div className={styles.rowItem} onClick={() => setSubview('sonido')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#FF2D55' }}>
                  <span className={styles.iconEmoji}></span>
                </div>
                <span className={styles.rowLabel}>Sonido</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowValue}>{soundMuted ? 'Mute' : `${soundVolume}%`}</span>
                <span className={styles.chevron}>›</span>
              </div>
            </div>

            <div className={styles.rowItem} onClick={() => setSubview('telefono')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#34C759' }}>
                  <span className={styles.iconEmoji}></span>
                </div>
                <span className={styles.rowLabel}>Teléfono</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.rowValue}>{personaje?.numero || '555-0192'}</span>
                <span className={styles.chevron}>›</span>
              </div>
            </div>
          </div>

          {/* Group 2: System Settings */}
          <div className={styles.group}>
            <div className={styles.rowItem} onClick={() => setSubview('general')}>
              <div className={styles.rowLeft}>
                <div className={styles.iconBox} style={{ background: '#8E8E93' }}>
                  <span className={styles.iconEmoji}></span>
                </div>
                <span className={styles.rowLabel}>General</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.chevron}>›</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. SUBVIEWS
  return (
    <div className={styles.container}>
      <StatusBar />

      {/* Subview 1: Wallpaper */}
      {subview === 'wallpaper' && (
        <>
          {renderNavHeader('Fondo de Pantalla')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Fondos Disponibles</div>
            <div className={styles.wallpaperGrid}>
              {HOMESCREEN_WALLPAPERS.map((wall, idx) => (
                <div
                  key={wall.id}
                  className={`${styles.wallpaperCard} ${selectedWallIndex === idx ? styles.selectedWall : ''}`}
                  onClick={() => handleSelectWallpaper(idx)}
                >
                  <img src={wall.src} alt={wall.name} className={styles.wallpaperImage} />
                  <div className={styles.wallName}>{wall.name}</div>
                  {selectedWallIndex === idx && <div className={styles.wallCheckmark}>✓</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Subview 2: Apariencia */}
      {subview === 'apariencia' && (
        <>
          {renderNavHeader('Apariencia')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Personalización de Marco</div>
            <div className={styles.group}>
              <div className={styles.rowItem}>
                <div className={styles.rowLeft}>
                  <div className={styles.iconBox} style={{ background: '#5856D6' }}>
                    
                  </div>
                  <span className={styles.rowLabel}>Color del Marco</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.rowValue}>Próximamente</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subview 3: Notificaciones */}
      {subview === 'notificaciones' && (
        <>
          {renderNavHeader('Notificaciones')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Alertas de Aplicaciones</div>
            <div className={styles.group}>
              <div className={styles.rowItem}>
                <div className={styles.rowLeft}>
                  <div className={styles.iconBox} style={{ background: '#007AFF' }}>
                    
                  </div>
                  <span className={styles.rowLabel}>Permitir Notificaciones</span>
                </div>
                <div className={styles.rowRight}>
                  <IosToggle checked={notifEnabled} onChange={handleToggleNotif} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subview 4: Sonido */}
      {subview === 'sonido' && (
        <>
          {renderNavHeader('Sonido')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Controles de Audio</div>
            <div className={styles.group}>
              <div className={styles.rowItem}>
                <div className={styles.rowLeft}>
                  <div className={styles.iconBox} style={{ background: '#FF2D55' }}>
                    
                  </div>
                  <span className={styles.rowLabel}>Silenciar Sonido</span>
                </div>
                <div className={styles.rowRight}>
                  <IosToggle checked={soundMuted} onChange={handleToggleMute} />
                </div>
              </div>
            </div>

            <div className={styles.subHeaderLabel}>Volumen de Alertas</div>
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span>Nivel de Volumen</span>
                <span>{soundVolume}%</span>
              </div>
              <IosSlider
                value={soundVolume}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                leftSlot=""
                rightSlot=""
              />
            </div>
          </div>
        </>
      )}

      {/* Subview 5: Teléfono */}
      {subview === 'telefono' && (
        <>
          {renderNavHeader('Teléfono')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Información de la Línea</div>
            <div className={styles.group}>
              <div className={styles.rowItem}>
                <div className={styles.rowLeft}>
                  <div className={styles.iconBox} style={{ background: '#34C759' }}>
                    
                  </div>
                  <span className={styles.rowLabel}>Mi Número</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.rowValue}>{personaje?.numero || '555-0192'}</span>
                </div>
              </div>

              <div className={styles.rowItem} onClick={() => navigate('/contactos')}>
                <div className={styles.rowLeft}>
                  <div className={styles.iconBox} style={{ background: '#30B0C7' }}>
                    
                  </div>
                  <span className={styles.rowLabel}>Agenda de Contactos</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.rowValue}>{contactosCount} guardados</span>
                  <span className={styles.chevron}>›</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subview 6: General */}
      {subview === 'general' && (
        <>
          {renderNavHeader('General')}
          <div className={styles.content}>
            <div className={styles.subHeaderLabel}>Cuenta y Sesión</div>
            <div className={styles.logoutButton} onClick={handleLogout}>
              Cerrar Sesión
            </div>

            <div className={styles.subHeaderLabel}>Restablecimiento del Sistema</div>
            <div
              className={styles.dangerButton}
              onClick={() => setShowResetModal(true)}
            >
              Borrar iPhone (Restablecer Datos)
            </div>
          </div>
        </>
      )}

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div className={styles.modalOverlay} onClick={() => setShowResetModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>¿Borrar iPhone?</div>
            <div className={styles.modalDesc}>
              Se cerrará la sesión actual y se eliminarán las preferencias de personalización locales.
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowResetModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.btnConfirm}
                onClick={handleResetConfirm}
              >
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AjustesApp
