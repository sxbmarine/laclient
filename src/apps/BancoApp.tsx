import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusBar } from '@/components/StatusBar'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import { supabase, getDiscordId } from '@/lib/supabase'
import { getRobloxAvatarUrl } from '@/lib/roblox'
import { BANCOS, type BancoNombre, type CuentaBancaria, type Transaccion } from '@/types/database'

import chaseLogo from '@/assets/bancos/chase.png'
import boaLogo from '@/assets/bancos/boa.png'
import citiLogo from '@/assets/bancos/citibank.png'

import bg1 from '@/assets/backgrounds/banco/bankbg1.webp'
import bg2 from '@/assets/backgrounds/banco/bankbg2.jpg'
import bg3 from '@/assets/backgrounds/banco/bankbg3.jpg'
import bg4 from '@/assets/backgrounds/banco/bankbg4.jpg'

import styles from './BancoApp.module.css'

type View = 'list' | 'create' | 'transfer' | 'history'

const BACKGROUNDS_LIST = [null, bg1, bg2, bg3, bg4]

const BANK_METADATA: Record<string, { logo: string; name: string; cardClass: string }> = {
  'Chase Bank': {
    logo: chaseLogo,
    name: 'Chase Bank',
    cardClass: styles.chaseCard,
  },
  'Bank of America': {
    logo: boaLogo,
    name: 'Bank of America',
    cardClass: styles.boaCard,
  },
  'Citibank': {
    logo: citiLogo,
    name: 'Citibank',
    cardClass: styles.citiCard,
  },
}

export function generateRealisticAccountNumber(): string {
  const g1 = Math.floor(1000 + Math.random() * 9000).toString()
  const g2 = Math.floor(1000 + Math.random() * 9000).toString()
  const g3 = Math.floor(1000 + Math.random() * 9000).toString()
  return `${g1} ${g2} ${g3}`
}

export function getCardLastFour(accountNum: string): string {
  const cleaned = accountNum.replace(/\D/g, '')
  if (cleaned.length >= 4) {
    return `•••• ${cleaned.slice(-4)}`
  }
  return accountNum
}

interface RecentTransactionsProps {
  transacciones: Transaccion[]
  selectedCuenta: CuentaBancaria | null
  formatMoney: (n: number) => string
}

function RecentTransactionsList({ transacciones, selectedCuenta, formatMoney }: RecentTransactionsProps) {
  if (transacciones.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>
        Sin transacciones recientes
      </p>
    )
  }

  return (
    <div className="ios-list">
      {transacciones.slice(0, 10).map((t) => {
        const isOut = selectedCuenta ? t.cuenta_origen === selectedCuenta.numero_cuenta : false
        const amountText = (isOut ? '-' : '+') + formatMoney(t.monto)
        const labelText = t.concepto ? t.concepto : isOut ? 'Transferencia enviada' : 'Transferencia recibida'
        const rawDate = t.fecha || (t as any).created_at
        const dateText = rawDate ? new Date(rawDate).toLocaleDateString('es-ES') : ''
        const iconText = isOut ? '󰾬' : '󰿲'
        const amountClass = `${styles.txAmount} ${isOut ? styles.txAmountOut : styles.txAmountIn}`

        return (
          <div key={t.id} className="ios-list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className={styles.txIcon}>{iconText}</div>
              <div>
                <div className={styles.txTitle}>{labelText}</div>
                <div className={styles.txDate}>{dateText}</div>
              </div>
            </div>
            <span className={amountClass}>{amountText}</span>
          </div>
        )
      })}
    </div>
  )
}

export function BancoApp() {
  const navigate = useNavigate()
  const { personaje, user } = useAuth()
  const { notify } = useNotification()
  const [view, setView] = useState<View>('list')
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([])
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaBancaria | null>(null)
  const [transacciones, setTransacciones] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [infoCuenta, setInfoCuenta] = useState<CuentaBancaria | null>(null)
  const [copied, setCopied] = useState(false)

  const [bgIndex, setBgIndex] = useState(() => {
    const saved = localStorage.getItem('banco_bg_index')
    return saved !== null ? parseInt(saved, 10) || 0 : 0
  })

  const handleCycleBg = () => {
    setBgIndex((prev) => {
      const next = (prev + 1) % BACKGROUNDS_LIST.length
      localStorage.setItem('banco_bg_index', next.toString())
      return next
    })
  }

  const currentBg = BACKGROUNDS_LIST[bgIndex]

  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)

  const [newBanco, setNewBanco] = useState<BancoNombre>(BANCOS[0])
  const [pin, setPin] = useState('1234')
  const [destinoNumero, setDestinoNumero] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [concepto, setConcepto] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const cleanUsername = (personaje?.usuario_roblox || '')
    .replace(/^@/, '')
    .replace(/\s+/g, '')
    .trim()

  useEffect(() => {
    const targetName = cleanUsername || 'Roblox'
    const initialUrl = `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(
      targetName,
    )}&width=150&height=150&format=png`
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
    )}&width=150&height=150&format=png`

  const loadCuentas = useCallback(async () => {
    setLoading(true)
    setError(null)

    const rpcDiscordId = await getDiscordId().catch(() => null)
    const discordId =
      personaje?.discord_id ||
      user?.user_metadata?.provider_id ||
      user?.user_metadata?.sub ||
      user?.id

    const candidateIds = Array.from(
      new Set(
        [
          discordId,
          rpcDiscordId,
          personaje?.discord_id,
          user?.user_metadata?.provider_id,
          user?.user_metadata?.sub,
          user?.id,
        ].filter(Boolean) as string[],
      ),
    )

    if (candidateIds.length === 0 && !personaje?.id) {
      setCuentas([])
      setSelectedCuenta(null)
      setLoading(false)
      return
    }

    let query = supabase.from('cuentas_bancarias').select('*')

    if (candidateIds.length > 0) {
      query = query.in('discord_id', candidateIds)
    } else if (personaje?.id) {
      query = query.eq('personaje_id', personaje.id)
    }

    const { data, error: err } = await query.order('created_at', { ascending: false })

    if (err) {
      console.error('Error al cargar cuentas bancarias:', err.message)
      setError(err.message)
      setCuentas([])
    } else {
      const fetched = data ?? []
      setCuentas(fetched)
      if (fetched.length > 0 && !selectedCuenta) {
        setSelectedCuenta(fetched[0])
      } else if (fetched.length === 0) {
        setSelectedCuenta(null)
      }
    }
    setLoading(false)
  }, [personaje, user, selectedCuenta])

  const loadTransacciones = useCallback(async (numeroCuenta?: string) => {
    try {
      let query = supabase.from('transacciones').select('*').limit(50)
      if (numeroCuenta) {
        query = query.or(`cuenta_origen.eq.${numeroCuenta},cuenta_destino.eq.${numeroCuenta}`)
      }

      // Intentar ordenación por 'fecha'
      let { data, error: err } = await query.order('fecha', { ascending: false })

      // Alternativa si la columna de ordenación en la BD se llama 'created_at'
      if (err) {
        let altQuery = supabase.from('transacciones').select('*').limit(50)
        if (numeroCuenta) {
          altQuery = altQuery.or(`cuenta_origen.eq.${numeroCuenta},cuenta_destino.eq.${numeroCuenta}`)
        }
        const res = await altQuery.order('created_at', { ascending: false })
        if (res.data) {
          data = res.data
          err = null
        }
      }

      if (err) {
        console.error('Error al cargar transacciones:', err)
      } else {
        setTransacciones(data ?? [])
      }
    } catch (e) {
      console.error('Excepción al cargar transacciones:', e)
    }
  }, [])

  useEffect(() => {
    loadCuentas()
    loadTransacciones()
  }, [loadCuentas, loadTransacciones])

  useEffect(() => {
    if (view === 'history' || view === 'list') {
      loadTransacciones()
    }
  }, [view, loadTransacciones])

  const handleCarouselWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return
    if (e.deltaY !== 0) {
      carouselRef.current.scrollLeft += e.deltaY * 0.8
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeftPos(carouselRef.current.scrollLeft)
  }

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    carouselRef.current.scrollLeft = scrollLeftPos - walk
  }

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return
    const { scrollLeft } = carouselRef.current
    const cardWidth = 334 // 320px card width + 14px gap
    const idx = Math.min(
      Math.max(0, Math.round(scrollLeft / cardWidth)),
      cuentas.length - 1
    )
    if (idx !== activeIndex) {
      setActiveIndex(idx)
      if (cuentas[idx]) {
        setSelectedCuenta(cuentas[idx])
      }
    }
  }

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return
    const cardWidth = 334
    carouselRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    })
    setActiveIndex(index)
    if (cuentas[index]) {
      setSelectedCuenta(cuentas[index])
    }
  }

  const handleCreateAccount = async () => {
    setError(null)
    setSuccess(null)

    const discordId = personaje?.discord_id || (await getDiscordId()) || user?.user_metadata?.provider_id || user?.id
    if (!discordId) {
      setError('No se pudo obtener tu identidad de Discord')
      return
    }

    const numCuenta = generateRealisticAccountNumber()
    const pinCode = pin.trim() || '1234'

    const { error: err } = await supabase
      .from('cuentas_bancarias')
      .insert({
        discord_id: discordId,
        banco: newBanco,
        numero_cuenta: numCuenta,
        pin: pinCode,
        saldo: 0,
        activa: true,
      })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(`Cuenta ${numCuenta} creada correctamente en ${newBanco}`)
      setView('list')
      loadCuentas()
    }
  }

  const handleTransfer = async () => {
    if (!selectedCuenta) return
    setError(null)
    setSuccess(null)

    const monto = parseFloat(cantidad)
    if (isNaN(monto) || monto <= 0) {
      setError('Cantidad inválida')
      return
    }

    const destNum = destinoNumero.trim()
    if (!destNum) {
      setError('Introduce un número de cuenta destino')
      return
    }

    if (monto > Number(selectedCuenta.saldo)) {
      setError('Saldo insuficiente')
      return
    }

    // Intentar vía RPC 4 parámetros
    const { error: err } = await supabase.rpc('transferir', {
      p_cuenta_origen: selectedCuenta.numero_cuenta,
      p_cuenta_destino: destNum,
      p_monto: monto,
      p_concepto: concepto || null,
    })

    if (err) {
      // Si la función RPC no existe en la base de datos o hay discrepancia de firmas
      if (err.message?.includes('schema cache') || err.code === 'PGRST202') {
        // Fallback 1: Intentar RPC original de 3 parámetros
        const { error: err3 } = await supabase.rpc('transferir', {
          p_cuenta_destino: destNum,
          p_monto: monto,
          p_concepto: concepto || null,
        })

        if (!err3) {
          notify({
            title: 'Chase Bank — Transferencia Realizada',
            message: `Enviados $${monto.toLocaleString()} a cta. ${destNum}`,
            app: 'banco',
            timeText: 'Ahora',
          })
          setSuccess('Transferencia realizada con éxito')
          setDestinoNumero('')
          setCantidad('')
          setConcepto('')
          setView('list')
          loadCuentas()
          loadTransacciones()
          return
        }

        // Fallback 2: Transferencia directa vía cliente Supabase
        const { data: destCuenta, error: destErr } = await supabase
          .from('cuentas_bancarias')
          .select('*')
          .eq('numero_cuenta', destNum)
          .single()

        if (destErr || !destCuenta) {
          setError('La cuenta de destino no existe o no está activa')
          return
        }

        // Descontar saldo del origen
        const { error: subErr } = await supabase
          .from('cuentas_bancarias')
          .update({ saldo: Number(selectedCuenta.saldo) - monto })
          .eq('id', selectedCuenta.id)

        if (subErr) {
          setError(subErr.message)
          return
        }

        // Sumar saldo al destino
        await supabase
          .from('cuentas_bancarias')
          .update({ saldo: Number(destCuenta.saldo || 0) + monto })
          .eq('id', destCuenta.id)

        // Registrar historial de la transacción
        await supabase.from('transacciones').insert({
          cuenta_origen: selectedCuenta.numero_cuenta,
          cuenta_destino: destNum,
          monto: monto,
          concepto: concepto || null,
          fecha: new Date().toISOString(),
        })

        notify({
          title: 'Chase Bank — Transferencia Realizada',
          message: `Enviados $${monto.toLocaleString()} a cta. ${destNum}`,
          app: 'banco',
          timeText: 'Ahora',
        })
        setSuccess('Transferencia realizada con éxito')
        setDestinoNumero('')
        setCantidad('')
        setConcepto('')
        setView('list')
        loadCuentas()
        loadTransacciones()
        return
      }

      setError(err.message)
    } else {
      notify({
        title: 'Chase Bank — Transferencia Realizada',
        message: `Enviados $${monto.toLocaleString()} a cta. ${destNum}`,
        app: 'banco',
        timeText: 'Ahora',
      })
      setSuccess('Transferencia realizada con éxito')
      setDestinoNumero('')
      setCantidad('')
      setConcepto('')
      setView('list')
      loadCuentas()
      loadTransacciones()
    }
  }

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const totalNetWorth = cuentas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0)

  const renderList = () => (
    <div className="fade-in">
      {/* Header mis tarjetas y avatar */}
      <div className={styles.headerRow}>
        <h1 className={styles.myCardsTitle}>Mis tarjetas</h1>
        <div className={styles.headerRightGroup}>
          <button
            type="button"
            className={styles.bgChangeBtn}
            onClick={handleCycleBg}
            title="Cambiar fondo de pantalla"
          >
            <span className="sf-symbol" style={{ fontSize: '30px', color: '#ffffff' }}></span>
          </button>

          <div className={styles.userAvatarWrapper}>
            <img
              src={avatarSrc}
              alt={personaje?.nombre || 'Usuario'}
              className={styles.userAvatarImg}
              onError={(e) => {
                const el = e.currentTarget
                const fallback = `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanUsername || 'Roblox')}&width=420&height=420&format=png`
                if (el.src !== fallback) {
                  el.src = fallback
                }
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /></div>
      ) : cuentas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏦</span>
          <p>No tienes cuentas bancarias</p>

          <div className={styles.netWorthCard} style={{ width: '100%', marginTop: 20 }}>
            <div>
              <div className={styles.netWorthTitle}>Dinero total en cuentas</div>
              <div className={styles.netWorthAmount}>$0.00</div>
            </div>
          </div>

          <button className="ios-btn ios-btn-primary" onClick={() => setView('create')} style={{ marginTop: 16 }}>
            Crear cuenta bancaria
          </button>
        </div>
      ) : (
        <div>
          {/* Carrusel de Tarjetas con Rueda de Ratón y Arrastre con Mouse */}
          <div
            ref={carouselRef}
            className={styles.cardsCarousel}
            onScroll={handleCarouselScroll}
            onWheel={handleCarouselWheel}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
          >
            {cuentas.map((c) => {
              const meta = BANK_METADATA[c.banco] || BANK_METADATA['Chase Bank']
              return (
                <div
                  key={c.id}
                  className={`${styles.bankCard} ${meta.cardClass}`}
                  onClick={() => setSelectedCuenta(c)}
                >
                  <div className={styles.cardTop}>
                    <img src={meta.logo} alt={c.banco} className={styles.bankLogo} />
                    <span
                      className={styles.cardDigits}
                      onClick={(e) => {
                        e.stopPropagation()
                        setInfoCuenta(c)
                      }}
                      title="Ver número de cuenta completo"
                    >
                      {getCardLastFour(c.numero_cuenta)}
                    </span>
                  </div>

                  <div className={styles.cardMiddle}>
                    <div className={styles.cardBalance}>{formatMoney(c.saldo)}</div>
                  </div>

                  <div className={styles.cardBottom}>
                    <div className={styles.cardSubtitle}>{c.banco} Debit</div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.cardActionBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCuenta(c)
                          setView('transfer')
                        }}
                      >
                        Transferencia
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Indicadores de paginación estilo . y _ */}
          {cuentas.length > 1 && (
            <div className={styles.paginationDots}>
              {cuentas.map((_, idx) => {
                const isSelected = idx === activeIndex
                const dotClass = `${styles.dot} ${isSelected ? styles.activeDot : ''}`
                return (
                  <button
                    key={idx}
                    type="button"
                    className={dotClass}
                    onClick={() => scrollToCard(idx)}
                  />
                )
              })}
            </div>
          )}

          {/* Abajo total net worth */}
          <div className={styles.netWorthCard}>
            <div>
              <div className={styles.netWorthTitle}>Dinero total en cuentas</div>
              <div className={styles.netWorthAmount}>{formatMoney(totalNetWorth)}</div>
            </div>
            <span style={{ fontSize: 20 }}>📈</span>
          </div>

          {/* Barra de acciones rápidas */}
          <div className={styles.actionBar}>
            <button className={styles.actionItem} onClick={() => setView('create')}>
              <span className="sf-symbol" style={{ color: 'var(--accent)', fontSize: '30px' }}></span>
              <span className={styles.actionText}>Nueva tarjeta</span>
            </button>
            <button
              className={styles.actionItem}
              onClick={() => {
                if (cuentas.length > 0) setSelectedCuenta(cuentas[0])
                setView('transfer')
              }}
            >
              <span className="sf-symbol" style={{ fontSize: '30px', color: 'var(--accent)' }}></span>
              <span className={styles.actionText}>Transferir</span>
            </button>
            <button
              className={styles.actionItem}
              onClick={() => {
                loadTransacciones()
                setView('history')
              }}
            >
              <span className="sf-symbol" style={{ fontSize: '30px', color: 'var(--accent)' }}></span>
              <span className={styles.actionText}>Movimientos</span>
            </button>
          </div>

          {/* Lista de Movimientos Recientes */}
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Transacciones recientes</h3>
            <RecentTransactionsList
              transacciones={transacciones}
              selectedCuenta={selectedCuenta}
              formatMoney={formatMoney}
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderCreate = () => (
    <div className={`${styles.form} fade-in`}>
      <label className="ios-label">Selecciona tu banco estadounidense</label>

      {/* Grid selector de bancos con logos cuadrados */}
      <div className={styles.bankSelectorGrid}>
        {BANCOS.map((b) => {
          const meta = BANK_METADATA[b]
          const isSelected = newBanco === b
          const btnClass = `${styles.bankOption} ${isSelected ? styles.bankOptionSelected : ''}`
          return (
            <button
              key={b}
              type="button"
              className={btnClass}
              onClick={() => setNewBanco(b)}
            >
              <img src={meta.logo} alt={b} className={styles.bankOptionLogo} />
              <span className={styles.bankOptionName}>{b}</span>
              {isSelected && <span style={{ color: 'var(--accent)', fontWeight: 800 }}>✓</span>}
            </button>
          )
        })}
      </div>

      <label className="ios-label">PIN de la cuenta (4 dígitos)</label>
      <input
        className="ios-input"
        type="password"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="1234"
        style={{ marginBottom: 20 }}
      />

      <button className="ios-btn ios-btn-primary" onClick={handleCreateAccount}>
        Emitir tarjeta en {newBanco}
      </button>
    </div>
  )

  const renderTransfer = () => (
    <div className={`${styles.form} fade-in`}>
      {selectedCuenta && (
        <div className={styles.accountInfo}>
          <div style={{ fontWeight: 400 }}>Desde: {selectedCuenta.banco}</div>
          <div style={{ fontSize: 18 }}>Cuenta: {selectedCuenta.numero_cuenta}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-green)', marginTop: 4 }}>
            Saldo disponible: {formatMoney(selectedCuenta.saldo)}
          </div>
        </div>
      )}
      <label className="ios-label">Número de cuenta destino (12 dígitos)</label>
      <input
        className="ios-input"
        value={destinoNumero}
        onChange={(e) => setDestinoNumero(e.target.value)}
        placeholder="Ej: 4839 2019 4812"
        style={{ marginBottom: 12 }}
      />
      <label className="ios-label">Monto a transferir ($)</label>
      <input
        className="ios-input"
        type="number"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        placeholder="0.00"
        min="0"
        step="0.01"
        style={{ marginBottom: 12 }}
      />
      <label className="ios-label">Concepto (opcional)</label>
      <input
        className="ios-input"
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Ej: Pago de alquiler"
        style={{ marginBottom: 16 }}
      />
      <button className="ios-btn ios-btn-primary" onClick={handleTransfer}>
        Confirmar Transferencia
      </button>
    </div>
  )

  const renderHistory = () => (
    <div className="fade-in">
      {transacciones.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📜</span>
          <p>Sin movimientos registrados</p>
          <button
            className="ios-btn ios-btn-secondary"
            style={{ marginTop: 16, width: 'auto', padding: '8px 20px' }}
            onClick={() => loadTransacciones()}
          >
            Actualizar
          </button>
        </div>
      ) : (
        <div className="ios-list">
          {transacciones.map((t) => {
            const isOut = selectedCuenta ? t.cuenta_origen === selectedCuenta.numero_cuenta : false
            const amountStr = (isOut ? '-' : '+') + formatMoney(t.monto)
            const color = isOut ? 'var(--accent-red)' : 'var(--accent-green)'
            const rawDate = t.fecha || (t as any).created_at
            const dateStr = rawDate ? new Date(rawDate).toLocaleString('es-ES') : ''
            return (
              <div key={t.id} className="ios-list-item">
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {isOut ? '↑ Enviado' : '↓ Recibido'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {t.concepto || 'Sin concepto'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {dateStr}
                  </div>
                </div>
                <span style={{ fontWeight: 700, color }}>
                  {amountStr}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const titles: Record<View, string> = {
    list: 'Banco',
    create: 'Nueva cuenta',
    transfer: 'Transferir',
    history: 'Historial',
  }

  return (
    <div
      className={styles.app}
      style={
        currentBg
          ? {
            backgroundImage: `linear-gradient(rgba(9, 9, 12, 0.55), rgba(9, 9, 12, 0.8)), url(${currentBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }
          : undefined
      }
    >
      <StatusBar
        title={titles[view]}
        light
        showBack
        onBack={() => {
          if (view === 'list') navigate('/')
          else setView('list')
        }}

      />
      <div className={`${styles.content} app-scroll`}>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        {view === 'list' && renderList()}
        {view === 'create' && renderCreate()}
        {view === 'transfer' && renderTransfer()}
        {view === 'history' && renderHistory()}
      </div>

      {/* Modal Popup al pulsar el número de cuenta acortado */}
      {infoCuenta && (
        <div className={styles.modalOverlay} onClick={() => setInfoCuenta(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHandle} />

            <div className={styles.modalHeader}>
              <img
                src={(BANK_METADATA[infoCuenta.banco] || BANK_METADATA['Chase Bank']).logo}
                alt={infoCuenta.banco}
                className={styles.modalBankLogo}
              />
              <div>
                <h3 className={styles.modalBankTitle}>{infoCuenta.banco}</h3>
                <p className={styles.modalBankSubtitle}>Detalles de la cuenta</p>
              </div>
            </div>

            <div className={styles.modalAccountBox}>
              <span className={styles.modalAccountLabel}>Número de cuenta completo</span>
              <div className={styles.modalAccountRow}>
                <span className={styles.modalAccountNum}>{infoCuenta.numero_cuenta}</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => {
                    navigator.clipboard.writeText(infoCuenta.numero_cuenta)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  title="Copiar número de cuenta"
                >
                  {copied ? '✓ Copiado' : ' Copiar'}
                </button>
              </div>
            </div>

            <button
              className="ios-btn ios-btn-secondary"
              onClick={() => setInfoCuenta(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
