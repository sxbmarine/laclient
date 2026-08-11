import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import { JuzgadosPage } from '@/apps/web/JuzgadosPage'
import { TrafficPage } from '@/apps/web/traffic/TrafficPage'

import juzgadosIcon from '@/assets/icons/web/image.png'
import googleBanner from '@/assets/chrome/banner.png'
import googleGIcon from '@/assets/chrome/square.png'
import styles from './ChromeApp.module.css'

export function ChromeApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, personaje } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const isTrafficPage = location.pathname.includes('traffic')
  const isJuzgadosPage = location.pathname.includes('juzgados')

  // Resolve Roblox avatar
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase().trim()
    if (q.includes('multa') || q.includes('traffic') || q.includes('trafico')) {
      navigate('/chrome/juzgados/traffic')
    } else if (q.includes('juzgado') || q.includes('lacourt') || q.includes('corte')) {
      navigate('/chrome/juzgados')
    }
  }

  if (isTrafficPage) {
    return (
      <div className={styles.container}>
        <StatusBar />

        {/* Chrome Active Web Page URL Bar */}
        <div className={styles.webUrlBar}>
          <div className={styles.urlPill}>
            <span style={{ fontSize: '13px', color: '#9aa0a6' }}></span>
            <span className={styles.urlText}>lacourt.ca.gov/traffic</span>
            <span style={{ fontSize: '14px', color: '#9aa0a6', cursor: 'pointer' }}></span>
          </div>
        </div>

        {/* Web Page Content */}
        <div className={styles.webPageContent}>
          <TrafficPage />
        </div>

        {/* Bottom Chrome Navigation Bar */}
        <div className={styles.bottomNav}>
          <button className={styles.navActionBtn} onClick={() => navigate('/chrome/juzgados')}>
            
          </button>
          <button className={styles.navActionBtn}></button>
          <button className={styles.navActionBtn} onClick={() => navigate('/chrome')}>
            <div className={styles.addTabCircle}></div>
          </button>
          <button className={styles.navActionBtn}>
            <div className={styles.tabsBadge}>29</div>
          </button>
          <button className={styles.navActionBtn}>•••</button>
        </div>
      </div>
    )
  }

  if (isJuzgadosPage) {
    return (
      <div className={styles.container}>
        <StatusBar />

        {/* Chrome Active Web Page URL Bar */}
        <div className={styles.webUrlBar}>
          <div className={styles.urlPill}>
            <span style={{ fontSize: '13px', color: '#9aa0a6' }}></span>
            <span className={styles.urlText}>lacourt.ca.gov</span>
            <span style={{ fontSize: '14px', color: '#9aa0a6', cursor: 'pointer' }}></span>
          </div>
        </div>

        {/* Web Page Content */}
        <div className={styles.webPageContent}>
          <JuzgadosPage />
        </div>

        {/* Bottom Chrome Navigation Bar */}
        <div className={styles.bottomNav}>
          <button className={styles.navActionBtn} onClick={() => navigate('/chrome')}>
            
          </button>
          <button className={styles.navActionBtn}></button>
          <button className={styles.navActionBtn} onClick={() => navigate('/chrome')}>
            <div className={styles.addTabCircle}></div>
          </button>
          <button className={styles.navActionBtn}>
            <div className={styles.tabsBadge}>29</div>
          </button>
          <button className={styles.navActionBtn}>•••</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <StatusBar />

      {/* Top Bar with Edit Pencil & Roblox Avatar */}
      <div className={styles.topBar}>
        <button className={styles.iconCircleBtn} title="Editar">
          
        </button>
        <img
          src={avatarUrl}
          alt="Profile"
          className={styles.profileAvatar}
          onError={(e) => {
            e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(personaje?.nombre || 'user')}`
          }}
        />
      </div>

      {/* Main Scrollable Content */}
      <div className={styles.content}>
        {/* Google Logo Image */}
        <img src={googleBanner} alt="Google" className={styles.googleLogoImg} />

        {/* Search Bar Pill */}
        <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
          <img src={googleGIcon} alt="Google Search" className={styles.searchIconGImg} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Busca en Google o inserta una URL"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={styles.searchRightActions}>
            <span></span>
            <div className={styles.dividerLine} />
            <span>󰧶</span>
          </div>
        </form>

        {/* AI Mode & Incognito Pills */}
        <div className={styles.actionPills}>
          <button className={styles.pillBtn}>
            <span></span> Modo IA
          </button>
          <button className={styles.pillBtn}>
            <span>󰗹</span> Incógnito
          </button>
        </div>

        {/* Most Visited Bookmarks Section Card */}
        <div className={styles.cardSection}>
          <div className={styles.bookmarksGrid}>
            {/* 1. Juzgados (with official web image icon) */}
            <button className={styles.bookmarkItem} onClick={() => navigate('/chrome/juzgados')}>
              <div className={styles.bookmarkBadge}>
                <img src={juzgadosIcon} alt="Juzgados" className={styles.bookmarkImg} />
              </div>
              <span className={styles.bookmarkLabel}>Juzgados</span>
            </button>

            {/* 2. LEMD charts (without image icon - letter placeholder) */}
            <button className={styles.bookmarkItem}>
              <div className={styles.bookmarkBadge}>
                <span className={styles.bookmarkLetter} style={{ color: '#FF9500' }}>L</span>
              </div>
              <span className={styles.bookmarkLabel}>LEMD charts</span>
            </button>

            {/* 3. Bloxflip (without image icon - letter placeholder) */}
            <button className={styles.bookmarkItem}>
              <div className={styles.bookmarkBadge}>
                <span className={styles.bookmarkLetter} style={{ color: '#FFCC00' }}>B</span>
              </div>
              <span className={styles.bookmarkLabel}>Bloxflip</span>
            </button>

            {/* 4. DeFlock (without image icon - letter placeholder) */}
            <button className={styles.bookmarkItem}>
              <div className={styles.bookmarkBadge}>
                <span className={styles.bookmarkLetter} style={{ color: '#5856D6' }}>D</span>
              </div>
              <span className={styles.bookmarkLabel}>DeFlock</span>
            </button>

            {/* 5. Google Search (without image icon - letter placeholder) */}
            <button className={styles.bookmarkItem}>
              <div className={styles.bookmarkBadge}>
                <span className={styles.bookmarkLetter} style={{ color: '#4285F4' }}>G</span>
              </div>
              <span className={styles.bookmarkLabel}>Google Search</span>
            </button>

            {/* 6. Add Shortcut */}
            <button className={styles.bookmarkItem}>
              <div className={`${styles.bookmarkBadge} ${styles.addBadge}`}>
                +
              </div>
              <span className={styles.bookmarkLabel}>Add Shortcut</span>
            </button>
          </div>
        </div>

        {/* Shortcuts Section Card */}
        <div className={styles.cardSection}>
          <div className={styles.cardTitle}>Shortcuts</div>
          <div className={styles.shortcutsGrid}>
            <button className={styles.shortcutItem}>
              <div className={styles.shortcutBadge}></div>
              <span className={styles.shortcutLabel}>Bookmarks</span>
            </button>

            <button className={styles.shortcutItem}>
              <div className={styles.shortcutBadge}></div>
              <span className={styles.shortcutLabel}>Reading list</span>
            </button>

            <button className={styles.shortcutItem}>
              <div className={styles.shortcutBadge}>󰾰</div>
              <span className={styles.shortcutLabel}>Recent tabs</span>
            </button>

            <button className={styles.shortcutItem}>
              <div className={styles.shortcutBadge}></div>
              <span className={styles.shortcutLabel}>History</span>
            </button>
          </div>
        </div>

        {/* Discover News Card */}
        <div className={styles.cardSection}>
          <div className={styles.cardTitle}>Discover</div>
          <div className={styles.discoverContent}>
            <div className={styles.discoverHeadline}>
              Where to see the biggest solar eclipse since 1999 in the West Country
            </div>
            <img
              src="https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=300&q=80"
              alt="Eclipse"
              className={styles.discoverImage}
            />
          </div>
          <div className={styles.discoverFooter}>
            <span>BBC · 2d</span>
            <span style={{ fontSize: '18px', cursor: 'pointer' }}>...</span>
          </div>
        </div>
      </div>

      {/* Bottom Chrome Navigation Bar */}
      <div className={styles.bottomNav}>
        <button className={styles.navActionBtn}></button>
        <button className={styles.navActionBtn}></button>
        <button className={styles.navActionBtn}>
          <div className={styles.addTabCircle}></div>
        </button>
        <button className={styles.navActionBtn}>
          <div className={styles.tabsBadge}>29</div>
        </button>
        <button className={styles.navActionBtn}>•••</button>
      </div>
    </div>
  )
}

export default ChromeApp
