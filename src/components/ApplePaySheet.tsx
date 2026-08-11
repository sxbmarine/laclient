import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import styles from './ApplePaySheet.module.css'

export interface ApplePayItem {
  id: string | number
  title: string
  merchantName: string
  amount: number
  description?: string
  rawItem?: any
}

export interface ApplePaySheetProps {
  isOpen: boolean
  onClose: () => void
  item: ApplePayItem | null
  onPaymentSuccess: (item: ApplePayItem, card: any) => Promise<boolean | void> | boolean | void
}

export function ApplePaySheet({
  isOpen,
  onClose,
  item,
  onPaymentSuccess,
}: ApplePaySheetProps) {
  const { personaje, user } = useAuth()
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Load user's REAL bank accounts from Supabase table 'cuentas_bancarias'
  useEffect(() => {
    if (!isOpen || !personaje) return

    let isMounted = true
    const loadRealAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('cuentas_bancarias')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error cargando cuentas bancarias:', error.message)
        }

        if (isMounted && data && data.length > 0) {
          // Filter accounts matching user's discord_id or personaje_id
          const userAccounts = data.filter((c) => {
            const matchDiscord =
              personaje.discord_id && String(c.discord_id) === String(personaje.discord_id)
            const matchPersonaje =
              personaje.id && String(c.personaje_id) === String(personaje.id)
            return matchDiscord || matchPersonaje
          })

          // Use filtered accounts if available, otherwise use all accounts from database
          const finalAccounts = userAccounts.length > 0 ? userAccounts : data
          setBankAccounts(finalAccounts)
        } else if (isMounted) {
          // Fallback if database table has no accounts yet
          setBankAccounts([
            {
              id: 'card_chase',
              banco: 'Chase Bank',
              numero_cuenta: '4532 8821 9912',
              saldo: 12500,
              direccion: '27 Fredrick Butte Rd, Los Angeles, CA',
            },
          ])
        }
      } catch (err) {
        console.error('Excepción al cargar cuentas:', err)
      }
    }

    setIsProcessing(false)
    setIsSuccess(false)
    setShowAccountPicker(false)
    loadRealAccounts()

    return () => {
      isMounted = false
    }
  }, [isOpen, personaje])

  if (!isOpen || !item) return null

  const activeCard = bankAccounts[selectedCardIndex] || {
    banco: 'Chase Bank',
    numero_cuenta: '•••• 1234',
    saldo: 1000,
    direccion: '27 Fredrick Butte Rd, Los Angeles, CA',
  }

  const handleConfirmPay = async () => {
    if (isProcessing || isSuccess) return

    const currentSaldo = Number(activeCard?.saldo ?? 0)
    const requiredAmount = item.amount

    // Check balance before processing: if balance is insufficient, close Apple Pay immediately and notify
    if (activeCard && activeCard.saldo !== undefined && currentSaldo < requiredAmount) {
      onClose()
      await onPaymentSuccess(item, activeCard)
      return
    }

    setIsProcessing(true)

    // Simulate Apple Pay authorization delay
    setTimeout(async () => {
      try {
        const result = await onPaymentSuccess(item, activeCard)
        if (result === false) {
          setIsProcessing(false)
          onClose()
          return
        }
      } catch (err) {
        console.error('Error procesando pago:', err)
        setIsProcessing(false)
        onClose()
        return
      }

      setIsProcessing(false)
      setIsSuccess(true)

      // Close modal after success animation
      setTimeout(() => {
        setIsSuccess(false)
        onClose()
      }, 1400)
    }, 1500)
  }

  const getCardLastFour = (numStr: string) => {
    if (!numStr) return '•••• 1234'
    if (numStr.startsWith('••••')) return numStr
    const cleaned = String(numStr).replace(/\D/g, '')
    return cleaned.length >= 4 ? `•••• ${cleaned.slice(-4)}` : numStr
  }

  // Get Card Badge Gradient Class based on Bank Name
  const getCardBadgeClass = (bankName: string) => {
    const name = String(bankName || '').toLowerCase()
    if (name.includes('chase')) return styles.cardChase
    if (name.includes('america') || name.includes('boa')) return styles.cardBoa
    if (name.includes('citi')) return styles.cardCiti
    return styles.cardApple
  }

  // Real character details
  const userName = personaje?.nombre || 'John Appleseed'
  const userEmail = personaje?.usuario_roblox
    ? `${personaje.usuario_roblox.toLowerCase().replace(/\s+/g, '')}@icloud.com`
    : user?.email || 'j.appleseed@icloud.com'

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheetPanel} onClick={(e) => e.stopPropagation()}>
        {/* Top Header Bar */}
        <div className={styles.sheetHeader}>
          {showAccountPicker ? (
            <>
              <button
                className={styles.closeBtn}
                style={{ width: 'auto', padding: '0 12px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: '#007aff', background: 'transparent' }}
                onClick={() => setShowAccountPicker(false)}
              >
                ‹ Volver
              </button>
              <span className={styles.pickerTitle} style={{ fontSize: '16px', fontWeight: 600 }}>Seleccionar Tarjeta</span>
              <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
                ✕
              </button>
            </>
          ) : (
            <>
              <div className={styles.applePayTitle}>
                <span className={styles.appleLogo}></span>
                <span>Pay</span>
              </div>
              <button className={styles.closeBtn} onClick={onClose} title="Cerrar">
                ✕
              </button>
            </>
          )}
        </div>

        {/* Account Selection View inside Apple Pay */}
        {showAccountPicker ? (
          <div className={styles.accountPickerOverlay}>
            <div className={styles.pickerList}>
              {bankAccounts.map((acc, index) => (
                <div
                  key={acc.id || index}
                  className={`${styles.pickerItem} ${
                    index === selectedCardIndex ? styles.pickerItemSelected : ''
                  }`}
                  onClick={() => {
                    setSelectedCardIndex(index)
                    setShowAccountPicker(false)
                  }}
                >
                  <div className={styles.itemLeft}>
                    <div className={`${styles.cardBadgeGradient} ${getCardBadgeClass(acc.banco)}`}>
                      {acc.banco?.toUpperCase().slice(0, 3) || 'CARD'}
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemTitle}>{acc.banco || 'Cuenta Bancaria'}</span>
                      <span className={styles.itemLastFour}>
                        {getCardLastFour(acc.numero_cuenta)} — Saldo: ${Number(acc.saldo || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {index === selectedCardIndex && <span style={{ color: '#007aff', fontWeight: 'bold' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        ) : isProcessing || isSuccess ? (
          /* Processing / Success State */
          <div className={styles.processingOverlay}>
            {isProcessing ? (
              <>
                <div className={styles.spinner} />
                <span className={styles.itemSubtext}>Procesando con Apple Pay...</span>
              </>
            ) : (
              <>
                <div className={styles.successCheck}>✓</div>
                <div className={styles.successText}>Pago Completado</div>
              </>
            )}
          </div>
        ) : (
          /* Exact Reference Screenshots Layout: 3 Grouped Blocks */
          <>
            {/* GROUP 1: Single Rounded Container (#2c2c2e) with Inset Dividers */}
            <div className={styles.topGroupCard}>
              {/* Row 1: Real Bank Card Item */}
              <div
                className={styles.groupRow}
                onClick={() => {
                  if (bankAccounts.length > 1) {
                    setShowAccountPicker(true)
                  }
                }}
              >
                <div className={styles.itemLeft}>
                  <div className={`${styles.cardBadgeGradient} ${getCardBadgeClass(activeCard.banco)}`}>
                    {activeCard.banco?.toUpperCase().slice(0, 3) || 'CARD'}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeaderLine}>
                      <span className={styles.itemTitle}>{activeCard.banco || 'Tarjeta Bancaria'}</span>
                      <span className={styles.itemLastFour}>
                        {getCardLastFour(activeCard.numero_cuenta)}
                      </span>
                    </div>
                    <span className={styles.itemSubtext}>
                      {activeCard.direccion || '27 Fredrick Butte Rd, Los Angeles, CA'}
                    </span>
                  </div>
                </div>
                <span className={styles.chevron}>›</span>
              </div>

              {/* Inset Divider 1 */}
              <div className={styles.rowDivider} />

              {/* Row 2: Real Character Contact Details */}
              <div className={styles.groupRow}>
                <div className={styles.itemLeft}>
                  <div className={styles.iconCircle}>👤</div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemSubtext} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      Contact
                    </span>
                    <span className={styles.itemTitle} style={{ fontSize: '14px' }}>
                      {userEmail}
                    </span>
                    <span className={styles.itemSubtext} style={{ fontSize: '13px' }}>
                      (458) 555-2863
                    </span>
                  </div>
                </div>
                <span className={styles.chevron}>›</span>
              </div>

              {/* Inset Divider 2 */}
              <div className={styles.rowDivider} />

              {/* Row 3: Real Character Ship To Details */}
              <div className={styles.groupRow}>
                <div className={styles.itemLeft}>
                  <div className={styles.iconCircle}>🏠</div>
                  <div className={styles.itemContent}>
                    <span className={styles.itemSubtext} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      Ship to
                    </span>
                    <span className={styles.itemTitle} style={{ fontSize: '14px' }}>
                      {userName}
                    </span>
                    <span className={styles.itemSubtext} style={{ fontSize: '13px' }}>
                      27 Fredrick Butte Rd, Los Angeles, CA
                    </span>
                  </div>
                </div>
                <span className={styles.chevron}>›</span>
              </div>
            </div>

            {/* GROUP 2: Standalone Pay Summary Box (#2c2c2e) */}
            <div className={styles.paySummaryGroupCard} onClick={handleConfirmPay}>
              <div className={styles.paySummaryLeft}>
                <span className={styles.payLabel}>Pay {item.merchantName}</span>
                <span className={styles.payAmount}>${item.amount.toFixed(2)}</span>
              </div>
              <span className={styles.chevron}>›</span>
            </div>

            {/* GROUP 3: Bottom Dark Confirmation Area with Divider Line above */}
            <div className={styles.confirmFooterArea} onClick={handleConfirmPay}>
              <div className={styles.sideButtonGraphic}>⇥</div>
              <span className={styles.confirmText}>Confirm with Side Button</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ApplePaySheet
