import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Speaker1 from './Speaker1'
import { NotificationOverlay } from '@/components/notifications/NotificationOverlay'
import faceIdSvg from '@/assets/system/faceid.svg'
import styles from './PhoneFrame.module.css'

interface PhoneFrameProps {
  children: React.ReactNode
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const [scale, setScale] = useState(1)
  const [isPinned, setIsPinned] = useState(false)
  const [isFaceIdActive, setIsFaceIdActive] = useState(false)
  const [isFocused, setIsFocused] = useState<boolean>(true)
  const [wallpaper, setWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('homescreen_wallpaper') || null
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function updateScale() {
      const scaleX = (window.innerWidth - 24) / 632.58
      const scaleY = (window.innerHeight - 24) / 1308.62
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

    const handleWallChange = (e: Event) => {
      const customEv = e as CustomEvent<string>
      if (customEv.detail) {
        setWallpaper(customEv.detail)
      } else {
        setWallpaper(localStorage.getItem('homescreen_wallpaper'))
      }
    }

    window.addEventListener('wallpaper:change', handleWallChange)

    const handleFaceIdStart = (e: Event) => {
      const customEv = e as CustomEvent<{ onComplete?: () => void }>
      setIsFaceIdActive(true)

      setTimeout(() => {
        setIsFaceIdActive(false)
        if (customEv.detail?.onComplete) {
          customEv.detail.onComplete()
        }
      }, 2300)
    }

    window.addEventListener('faceid:start', handleFaceIdStart)

    if (window.electronAPI?.getAlwaysOnTop) {
      window.electronAPI.getAlwaysOnTop().then((flag) => setIsPinned(flag))
    }

    return () => {
      window.removeEventListener('resize', updateScale)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('mouseenter', onMouseEnter)
      window.removeEventListener('wallpaper:change', handleWallChange)
      window.removeEventListener('faceid:start', handleFaceIdStart)
    }
  }, [])

  const handleHomeClick = () => {
    // Try clicking active screen back button (works for subviews like Banco create/transfer/history or any app back button)
    const backBtn = document.querySelector<HTMLButtonElement>('[class*="backBtn"]')
    if (backBtn) {
      backBtn.click()
    } else if (location.pathname !== '/') {
      navigate('/')
    }
  }

  const togglePinned = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextState = !isPinned
    setIsPinned(nextState)
    if (window.electronAPI?.setAlwaysOnTop) {
      await window.electronAPI.setAlwaysOnTop(nextState)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.scaler} ${!isFocused ? styles.unfocused : ''}`}
        style={{ transform: `scale(${scale})` }}
      >
        <div id="1205_1173" className={styles.phoneFrame}>
          {/* 1205_1174: side button 1 */}
          <div id="1205_1174" className={styles.strokeWrapper1205_1174}>
            <div className={styles.frame1205_1174}>
              <div id="1205_1175" className={styles.vector1205_1175}></div>
              <div id="1205_1176" className={styles.rectangle1205_1176}></div>
              <div id="1205_1177" className={styles.vector1205_1177}></div>
              <div id="1205_1178" className={styles.vector1205_1178}></div>
            </div>
            <div className={styles.stroke1205_1174}></div>
          </div>

          {/* 1205_1179: side button 2 */}
          <div id="1205_1179" className={styles.strokeWrapper1205_1179}>
            <div className={styles.frame1205_1179}>
              <div id="1205_1180" className={styles.vector1205_1180}></div>
              <div id="1205_1181" className={styles.rectangle1205_1181}></div>
              <div id="1205_1182" className={styles.vector1205_1182}></div>
              <div id="1205_1183" className={styles.vector1205_1183}></div>
            </div>
            <div className={styles.stroke1205_1179}></div>
          </div>

          {/* 1205_1184: side button 3 */}
          <div id="1205_1184" className={styles.strokeWrapper1205_1184}>
            <div className={styles.frame1205_1184}>
              <div id="1205_1185" className={styles.vector1205_1185}></div>
              <div id="1205_1186" className={styles.rectangle1205_1186}></div>
              <div id="1205_1187" className={styles.vector1205_1187}></div>
              <div id="1205_1188" className={styles.vector1205_1188}></div>
            </div>
            <div className={styles.stroke1205_1184}></div>
          </div>

          {/* 1205_1189: side button 4 */}
          <div id="1205_1189" className={styles.strokeWrapper1205_1189}>
            <div className={styles.frame1205_1189}>
              <div id="1205_1190" className={styles.vector1205_1190}></div>
              <div id="1205_1191" className={styles.rectangle1205_1191}></div>
              <div id="1205_1192" className={styles.vector1205_1192}></div>
              <div id="1205_1193" className={styles.vector1205_1193}></div>
            </div>
            <div className={styles.stroke1205_1189}></div>
          </div>

          {/* 1205_1194: DeviceMostOuterBorder */}
          <div id="1205_1194" className={styles.vector1205_1194}></div>

          {/* 1205_1195: Bezel / Mask / Speaker group */}
          <div id="1205_1195" className={styles.group1205_1195}>
            <div id="1205_1196" className={styles.rectangle1205_1196}></div>
            <div id="1205_1197" className={styles.vector1205_1197}></div>
            <Speaker1 id="1205_1200" className={styles.instance1205_1200} />
            <div id="1205_1204" className={styles.vector1205_1204}></div>
            <div id="1205_1207" className={styles.strokeWrapper1205_1207}>
              <div className={styles.rectangle1205_1207}></div>
              <div className={styles.stroke1205_1207}></div>
            </div>
          </div>

          {/* 1205_1208: Antenna lines */}
          <div id="1205_1208" className={styles.vector1205_1208}></div>

          {/* 1205_1216: Screen display with dynamic wallpaper background + active React app */}
          <div
            id="1205_1216"
            className={styles.vector1205_1216}
            style={
              wallpaper
                ? {
                    backgroundImage: `url(${wallpaper})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            <NotificationOverlay />
            {children}
            <div
              className={styles.homeIndicator}
              onClick={handleHomeClick}
              role="button"
              tabIndex={0}
              title="Atrás / Inicio"
            />
          </div>

          {/* 1205_1219: Dynamic Island */}
          <div
            id="1205_1219"
            className={`${styles.frame1205_1219} ${isFaceIdActive ? styles.frame1205_1219Expanded : ''}`}
          >
            <div
              id="1205_1220"
              className={`${styles.rectangle1205_1220} ${isFaceIdActive ? styles.rectangle1205_1220Expanded : ''}`}
            >
              {isFaceIdActive && (
                <div className={styles.faceIdContent}>
                  <img src={faceIdSvg} alt="Face ID" className={styles.faceIdSvgIcon} />
                  <span className={styles.faceIdText}>Face ID</span>
                </div>
              )}
            </div>

            {/* Puntito indicador Naranja/Verde a la izquierda de la cámara */}
            <div
              className={`${styles.statusDot} ${isPinned ? styles.greenDot : styles.orangeDot}`}
              onClick={togglePinned}
              role="button"
              tabIndex={0}
              title={
                isPinned
                  ? 'Verde: Fijado arriba (No pueden ponerse ventanas encima)'
                  : 'Naranja: Superponible (Pueden ponerse ventanas encima)'
              }
            />

            <div id="1205_1221" className={styles.frame1205_1221}>
              <div id="1205_1222" className={styles.vector1205_1222}></div>
              <div id="1205_1223" className={styles.vector1205_1223}></div>
              <div id="1205_1224" className={styles.vector1205_1224}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
