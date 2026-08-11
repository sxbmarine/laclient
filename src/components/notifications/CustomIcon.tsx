import bancoIcon from '@/assets/icons/banco.png'
import dnieIcon from '@/assets/icons/dnie.png'
import mapaIcon from '@/assets/icons/mapa.png'
import contactosIcon from '@/assets/icons/contactos.png'
import mensajesIcon from '@/assets/icons/mensajes.png'
import gpsIcon from '@/assets/icons/gps.png'
import ajustesIcon from '@/assets/icons/ajustes.png'
import chromeIcon from '@/assets/icons/chrome.webp'

import './CustomIcon.css'

interface CustomiconProps {
  Mode?: string
  id?: string
  className?: string
  app?: string
  iconUrl?: string
  customEmoji?: string
}

const APP_ICONS_MAP: Record<string, string> = {
  banco: bancoIcon,
  dnie: dnieIcon,
  multas: dnieIcon,
  mapa: mapaIcon,
  contactos: contactosIcon,
  mensajes: mensajesIcon,
  gps: gpsIcon,
  ajustes: ajustesIcon,
  system: ajustesIcon,
  chrome: chromeIcon,
}

export const CustomIcon = (props: CustomiconProps) => {
  const { Mode = 'Default', id, className = '', app, iconUrl } = props

  const targetImg = iconUrl || (app ? APP_ICONS_MAP[app] : null)

  if (targetImg) {
    return (
      <div className={['component-1_114', className].filter(Boolean).join(' ')} id={id}>
        <div className="customAppIconBadge" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <img
            src={targetImg}
            alt={app || 'App Icon'}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={['component-1_114', className].filter(Boolean).join(' ')}
      id={id}
    >
      <div id="1_114" className="Pixso-symbol-1_114">
        {Mode === 'Clear Light' && (
          <div id="1_115" className="Pixso-symbol-1_115">
            <div id="1_118" className="Pixso-rectangle-1_118"></div>
          </div>
        )}
        {Mode === 'Dark' && (
          <div id="1_116" className="Pixso-symbol-1_116">
            <div id="1_119" className="Pixso-rectangle-1_119"></div>
          </div>
        )}
        {Mode === 'Default' && (
          <div id="1_117" className="Pixso-symbol-1_117">
            <div id="1_120" className="Pixso-rectangle-1_120"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomIcon
