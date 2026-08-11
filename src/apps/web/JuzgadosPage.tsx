import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import courtHelpImg from '@/assets/juzgados/courthelp.png'
import { CourtLayout } from './CourtLayout'
import styles from './JuzgadosPage.module.css'

export function JuzgadosPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <CourtLayout>
      <div className={styles.container}>
        {/* 1. Hero Banner with CourtHelp */}
        <section className={styles.heroSection}>
          <div className={styles.courtHelpBox}>
            <div className={styles.courtHelpHeader}>
              <img src={courtHelpImg} alt="CourtHelp Beta" className={styles.courtHelpImg} />
            </div>
            <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="¿Cómo podemos ayudarte?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn}>
                
              </button>
            </form>
            <div className={styles.searchSubtitle}>
              Ejemplos: Solicitar un intérprete, paga una multa...
            </div>
          </div>
        </section>

        {/* 2. Quick Services Grid */}
        <section className={styles.quickServicesGrid}>
          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Jurado</div>
          </div>

          <div className={styles.serviceItem} onClick={() => navigate('/chrome/juzgados/traffic')}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Multas de Tráfico</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Acceder a un caso</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Autoservicio</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Órdenes de alejamiento</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}>󱩛</div>
            <div className={styles.serviceTitle}>Audiencias Remotas</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Servicios de Idiomas</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Accesibilidad</div>
          </div>

          <div className={styles.serviceItem}>
            <div className={styles.serviceIcon}></div>
            <div className={styles.serviceTitle}>Empleo</div>
          </div>
        </section>

        {/* 3. Efiling Feature Card Section */}
        <section className={styles.featureSection}>
          <div className={styles.efilingCard}>
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80"
              alt="Efiling"
              className={styles.efilingImg}
            />
            <h2 className={styles.efilingTitle}>eDocumentar</h2>
            <p className={styles.efilingDesc}>
              Presente documentos legales electrónicamente ante el Tribunal Superior del Condado de Los Ángeles.
            </p>
            <button className={styles.learnMoreBtn}>Más Información</button>
          </div>

          <div className={styles.viewAllBtnContainer}>
            <button className={styles.viewAllBtn}>Ver todos los programas</button>
          </div>
        </section>

        {/* 4. Court Communications Section */}
        <section className={styles.communicationsSection}>
          <h2 className={styles.commTitle}>Información del Tribunal</h2>
          <span className={styles.tagNotice}>Aviso a los Abogados</span>
          <div className={styles.commSubtitle}>
            El Tribunal Superior del Condado de Los Ángeles emite una orden general
          </div>
        </section>

        {/* 5. Types of Cases Section */}
        <section className={styles.typesSection}>
          <h2 className={styles.typesHeading}>Tipos de Casos</h2>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Apelación</span>
            </div>
            <p className={styles.caseDesc}>
              Obtenga información aplicable a la presentación de una apelación y a la navegación del proceso de apelación.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Civil</span>
            </div>
            <p className={styles.caseDesc}>
              Para que las partes privadas resuelvan disputas, incluyendo demandas, desalojos y cobros.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Criminal</span>
            </div>
            <p className={styles.caseDesc}>
              Los delitos penales se dividen en una de estas tres categorías: infracciones, misdemeanors o felonies.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Derecho Familiar</span>
            </div>
            <p className={styles.caseDesc}>
              Custodia de menores, manutención de menores y cónyuges, divorcio, paternidad y órdenes de restricción.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Juvenil</span>
            </div>
            <p className={styles.caseDesc}>
              Para casos que generalmente involucran a menores de 18 años. El tribunal de dependencia y el tribunal de justicia juvenil se encuentran en esta categoría.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}>󱍂</span>
              <span className={styles.caseTitle}>Salud Mental</span>
            </div>
            <p className={styles.caseDesc}>
              Para casos que involucran trastornos de salud mental y problemas legales relacionados con la salud mental.
            </p>
          </div>

          <div className={styles.caseCard}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Testamentaria</span>
            </div>
            <p className={styles.caseDesc}>
              Para casos relacionados con sucesiones, fideicomisos, tutelas, curatelas y compromisos de menores.
            </p>
          </div>

          <div className={styles.caseCardHighlight}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Pequeñas Reclamaciones</span>
            </div>
            <p className={styles.caseDesc}>
              Un tribunal civil que se ocupa de disputas de $12,500 o menos.
            </p>
          </div>

          <div className={styles.caseCard} onClick={() => navigate('/chrome/juzgados/traffic')}>
            <div className={styles.caseHeader}>
              <span className={styles.caseIcon}></span>
              <span className={styles.caseTitle}>Tráfico</span>
            </div>
            <p className={styles.caseDesc}>
              Involucra una citación o multa escrita por un oficial de policía por delitos de tránsito y no de tránsito.
            </p>
          </div>
        </section>

        {/* 6. Locate a Courthouse Section */}
        <section className={styles.courthouseSection}>
          <h2 className={styles.courthouseHeading}>Encuentra un juzgado</h2>
          <div className={styles.courthouseCard}>
            <div className={styles.courthouseRow}>
              <span className={styles.courtName}>Juzgado Principal</span>
              <span className={styles.courtAddress}>Main Street. 2121, postal 212, Los Ángeles</span>
            </div>
          </div>
        </section>

        {/* 7. Our Mission Section */}
        <section className={styles.missionSection}>
          <h2 className={styles.missionHeading}>Nuestra Misión</h2>
          <p className={styles.missionText}>
            El Tribunal Superior del Condado de Los Ángeles sirve a nuestra comunidad proporcionando acceso igualitario a la justicia a través de la resolución justa, oportuna y eficaz de todos los casos.
          </p>
        </section>
      </div>
    </CourtLayout>
  )
}

export default JuzgadosPage
