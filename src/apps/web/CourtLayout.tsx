import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import bannerImg from '@/assets/juzgados/image.png'
import bannerWhiteImg from '@/assets/juzgados/bannerwhite.png'
import styles from './CourtLayout.module.css'

export interface CourtLayoutProps {
  children: ReactNode
}

export function CourtLayout({ children }: CourtLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      {/* 1. Header with Full Superior Court Banner */}
      <header className={styles.header}>
        <img
          src={bannerImg}
          alt="Superior Court of California County of Los Angeles"
          className={styles.headerBannerImg}
          onClick={() => navigate('/chrome/juzgados')}
        />
        <button className={styles.menuBtn}>
          <span className={styles.menuIcon}></span>
          <span className={styles.menuLabel}>Menu</span>
        </button>
      </header>

      <div className={styles.accentBar} />

      {/* 2. Main Page Content */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* 3. Shared Footer Section */}
      <footer className={styles.footer}>
        <img
          src={bannerWhiteImg}
          alt="Superior Court of California County of Los Angeles"
          className={styles.footerBannerImg}
          onClick={() => navigate('/chrome/juzgados')}
        />

        <div className={styles.footerColumns}>
          <div>
            <h3 className={styles.footerColTitle}>En la Corte</h3>
            <div className={styles.footerColList}>
              <span className={styles.footerLink} onClick={() => navigate('/chrome/juzgados')}>Juzgados</span>
              <span className={styles.footerLink}>Jurado</span>
              <span className={styles.footerLink}>Artículos Prohibidos</span>
            </div>
          </div>

          <div>
            <h3 className={styles.footerColTitle}>Servicios</h3>
            <div className={styles.footerColList}>
              <span className={styles.footerLink}>Servicios en línea</span>
              <span className={styles.footerLink}>Centro de Autoayuda</span>
              <span className={styles.footerLink}>Abogados</span>
            </div>
          </div>

          <div>
            <h3 className={styles.footerColTitle}>Sobre Nosotros</h3>
            <div className={styles.footerColList}>
              <span className={styles.footerLink}>Sobre el Tribunal</span>
              <span className={styles.footerLink}>Días Festivos</span>
              <span className={styles.footerLink}>Empleos</span>
              <span className={styles.footerLink}>Contacta el Tribunal</span>
            </div>
          </div>
        </div>

        <div className={styles.socialSection}>
          <div className={styles.socialLabel}>Síguenos en:</div>
          <div className={styles.socialIcons}>
            <span className={styles.socialIconBtn}>󰋾</span>
            <span className={styles.socialIconBtn}>󰌻</span>
            <span className={styles.socialIconBtn}></span>
            <span className={styles.socialIconBtn}></span>
          </div>
        </div>

        <div className={styles.legalLinks}>
          <span className={styles.legalLinkItem}>Política de Privacidad</span>
          <span>|</span>
          <span className={styles.legalLinkItem}>Disclaimer</span>
          <span>|</span>
          <span className={styles.legalLinkItem}>Comentarios</span>
        </div>
      </footer>
    </div>
  )
}

export default CourtLayout
