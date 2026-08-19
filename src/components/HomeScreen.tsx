import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useDevice } from '@/contexts/DeviceContext'
import { StatusBar } from './StatusBar'
import styles from './HomeScreen.module.css'
import type { AppInfo } from '@/types/database'

import bancoIcon from '@/assets/icons/banco.png'
import dnieIcon from '@/assets/icons/dnie.png'
import mapaIcon from '@/assets/icons/mapa.png'
import contactosIcon from '@/assets/icons/contactos.png'
import mensajesIcon from '@/assets/icons/mensajes.png'
import gpsIcon from '@/assets/icons/gps.png'
import ajustesIcon from '@/assets/icons/ajustes.png'
import chromeIcon from '@/assets/icons/chrome.webp'
import tabletIcon from '@/assets/icons/tablet.webp'

const ICON_MAP: Record<string, string> = {
  banco: bancoIcon,
  dnie: dnieIcon,
  mapa: mapaIcon,
  contactos: contactosIcon,
  mensajes: mensajesIcon,
  gps: gpsIcon,
  ajustes: ajustesIcon,
  chrome: chromeIcon,
  tablet: tabletIcon,
}

export function getAppIconUrl(appId: string): string {
  return ICON_MAP[appId] || bancoIcon
}

const APPS: AppInfo[] = [
  { id: 'banco', name: 'Banco', icon: '', color: '#30d158', route: '/banco' },
  { id: 'dnie', name: 'DNIe', icon: '', color: '#0a84ff', route: '/dnie' },
  { id: 'mapa', name: 'Mapa', icon: '', color: '#ff9f0a', route: '/mapa' },
  { id: 'contactos', name: 'Contactos', icon: '', color: '#64d2ff', route: '/contactos' },
  { id: 'mensajes', name: 'Mensajes', icon: '', color: '#30d158', route: '/mensajes' },
  { id: 'gps', name: 'GPS', icon: '', color: '#ff375f', route: '/gps' },
  { id: 'ajustes', name: 'Ajustes', icon: '', color: '#8e8e93', route: '/ajustes' },
  { id: 'chrome', name: 'Chrome', icon: '', color: '#ffffff', route: '/chrome' },
  { id: 'tablet', name: 'Abrir Tablet', icon: '', color: '#34c759', route: '/tablet' },
]

export function HomeScreen() {
  const navigate = useNavigate()
  const { personaje } = useAuth()
  const { openTablet } = useDevice()

  const handleAppClick = (app: AppInfo) => {
    if (app.id === 'tablet') {
      openTablet()
    } else {
      navigate(app.route)
    }
  }

  return (
    <div className={styles.home}>
      <StatusBar />
      <div className={styles.content}>
        <div className={styles.grid}>
          {APPS.map((app) => (
            <button
              key={app.id}
              className={styles.appIcon}
              onClick={() => handleAppClick(app)}
            >
              <div className={styles.iconOuterFrame}>
                <div
                  className={styles.iconBg}
                  style={{ background: app.color }}
                >
                  <img
                    src={getAppIconUrl(app.id)}
                    alt={app.name}
                    className={styles.appIconImg}
                    onError={(e) => {
                      // Visual fallback if PNG is missing
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span className={styles.iconEmoji}>{app.icon}</span>
                </div>
              </div>
              <span className={styles.appName}>{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saludo posicionado justo sobre el dock */}
      <div className={styles.welcome}>
        <p className={styles.greeting}>
          {personaje ? `Hola, ${personaje.nombre}` : 'Bienvenido'}
        </p>
      </div>

      {/* Liquid Glass App Dock */}
      <div className={styles.dockContainer}>
        <div className={styles.liquidGlassWrapper}>
          <div className={styles.liquidGlassEffect}></div>
          <div className={styles.liquidGlassTint}></div>
          <div className={styles.liquidGlassShine}></div>
          <div className={styles.liquidGlassText}>
            <div className={styles.dockInner}>
              {APPS.slice(0, 4).map((app) => (
                <button
                  key={app.id}
                  className={styles.dockIcon}
                  onClick={() => navigate(app.route)}
                >
                  <div className={styles.iconOuterFrameDock}>
                    <div
                      className={styles.dockIconBg}
                      style={{ background: app.color }}
                    >
                      <img
                        src={getAppIconUrl(app.id)}
                        alt={app.name}
                        className={styles.appIconImg}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <span className={styles.iconEmoji}>{app.icon}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SVG Filter for Liquid Glass Effect */}
        <svg style={{ display: 'none' }}>
          <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.01"
              numOctaves={1}
              seed={5}
              result="turbulence"
            />
            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
              <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
              <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
            </feComponentTransfer>
            <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
            <feSpecularLighting
              in="softMap"
              specularConstant={1}
              specularExponent={100}
              lightingColor="white"
              result="specLight"
            >
              <fePointLight x={-200} y={-200} z={300} />
            </feSpecularLighting>
            <feComposite
              in="specLight"
              operator="arithmetic"
              k1={0}
              k2={1}
              k3={1}
              k4={0}
              result="litImage"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale={15}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </div>
    </div>
  )
}
