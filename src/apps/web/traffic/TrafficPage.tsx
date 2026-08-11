import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import { supabase } from '@/lib/supabase'
import { CourtLayout } from '../CourtLayout'
import { ApplePaySheet, type ApplePayItem } from '@/components/ApplePaySheet'
import styles from './TrafficPage.module.css'

export function TrafficPage() {
  const { personaje } = useAuth()
  const { notify } = useNotification()
  const [isSearching, setIsSearching] = useState(false)
  const [showFinesList, setShowFinesList] = useState(false)
  const [viewMode, setViewMode] = useState<'search' | 'pay'>('search')
  const [finesList, setFinesList] = useState<any[]>([])

  // Apple Pay Sheet State
  const [isApplePayOpen, setIsApplePayOpen] = useState(false)
  const [selectedPayItem, setSelectedPayItem] = useState<ApplePayItem | null>(null)

  const handleStartFlow = (mode: 'search' | 'pay') => {
    if (isSearching) return
    setIsSearching(true)
    setViewMode(mode)

    // Trigger Face ID Dynamic Island animation
    window.dispatchEvent(
      new CustomEvent('faceid:start', {
        detail: {
          onComplete: () => {
            fetchUserTrafficFines(mode)
          },
        },
      }),
    )
  }

  const fetchUserTrafficFines = async (mode: 'search' | 'pay') => {
    try {
      const discordId = personaje?.discord_id
      const personajeId = personaje?.id

      // Fetch multas from Supabase table 'multas'
      const { data, error } = await supabase
        .from('multas')
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        console.error('Error al obtener multas:', error.message)
        setFinesList([])
      } else {
        // Filter user's multas where tipo === 'traffic'
        const userTrafficFines = (data || []).filter((m: any) => {
          const isUser =
            (personajeId && String(m.personaje_id) === String(personajeId)) ||
            (discordId && String(m.discord_id) === String(discordId))
          const isTraffic = String(m.tipo || '').toLowerCase() === 'traffic' || !m.tipo
          const isUnpaid = mode === 'pay' ? (!m.pagado && m.estado !== 'pagada') : true
          return isUser && isTraffic && isUnpaid
        })

        setFinesList(userTrafficFines)
      }
    } catch (err) {
      console.error('Excepción al cargar multas:', err)
      setFinesList([])
    } finally {
      setViewMode(mode)
      setShowFinesList(true)
      setIsSearching(false)
    }
  }

  const handleOpenApplePay = (fine: any) => {
    const amount = Number(fine.dinero || fine.monto || 0)
    setSelectedPayItem({
      id: fine.id,
      title: fine.cargos || fine.motivo || 'Multa de Tráfico',
      merchantName: 'Superior Court of LA',
      amount: amount > 0 ? amount : 150,
      description: `Citación de Tráfico #${fine.id}`,
      rawItem: fine,
    })
    setIsApplePayOpen(true)
  }

  const handlePaymentSuccess = async (item: ApplePayItem, card: any): Promise<boolean> => {
    try {
      const currentSaldo = Number(card?.saldo ?? 0)
      const requiredAmount = item.amount

      // Insufficient balance check
      if (card && card.saldo !== undefined && currentSaldo < requiredAmount) {
        notify({
          title: 'Apple Pay — Pago Rechazado',
          message: `Saldo insuficiente en ${card.banco || 'su tarjeta'}. Se requieren $${requiredAmount.toLocaleString()} y su cuenta dispone de $${currentSaldo.toLocaleString()}.`,
          app: 'banco',
          timeText: 'Ahora',
        })
        return false
      }

      const fine = item.rawItem
      if (fine && fine.id) {
        // PRESERVE HISTORY: Update fine status to pagado = true (do NOT delete!)
        const { error } = await supabase
          .from('multas')
          .update({ pagado: true, estado: 'pagada', fecha_pago: new Date().toISOString() })
          .eq('id', fine.id)

        if (error) {
          console.error('Error al marcar la multa como pagada:', error.message)
        }
      }

      // Deduct balance from user's bank account if account ID exists
      if (card && card.id && card.saldo !== undefined) {
        const newBalance = Math.max(0, currentSaldo - requiredAmount)
        await supabase
          .from('cuentas_bancarias')
          .update({ saldo: newBalance })
          .eq('id', card.id)
      }

      // Update local state: remove from pay list or mark as paid
      setFinesList((prev) =>
        viewMode === 'pay'
          ? prev.filter((f) => String(f.id) !== String(item.id))
          : prev.map((f) => (String(f.id) === String(item.id) ? { ...f, pagado: true, estado: 'pagada' } : f)),
      )

      // Trigger iOS Notification
      notify({
        title: 'Apple Pay — Pago Exitoso',
        message: `Pagado $${requiredAmount.toFixed(2)} a ${item.merchantName} con ${card.banco || 'Apple Card'}`,
        app: 'banco',
        timeText: 'Ahora',
      })
      return true
    } catch (err) {
      console.error('Error al liquidar multa:', err)
      return false
    }
  }

  return (
    <CourtLayout>
      <div className={styles.container}>
        {/* Top Hero Header Section */}
        <div className={styles.heroSection}>
          <h1 className={styles.mainTitle}>Traffic</h1>
          <p className={styles.descriptionText}>
            El Juzgado de Tráfico se responsabiliza de casos que usualmente comienzan cuando una citación o multa es emitida por un oficial de la ley. Las multas pueden ser emitidas por violaciones de leyes de tráfico y otras ofensas no relacionadas con el tráfico.
          </p>
          <img
            src="https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1000&q=80"
            alt="LA Traffic"
            className={styles.landscapeImage}
          />
        </div>

        {/* Dynamic Display: Search Options vs User Traffic Fines List */}
        {!showFinesList ? (
          <div className={styles.cardsContainer}>
            {/* Card 1: Traffic Citation Alert */}
            <div className={styles.cardItem}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Alerta de Citación de Tráfico</h2>
              </div>
              <div className={styles.cardGoldLine} />
              <div className={styles.cardBody}>
                <p className={styles.cardText}>
                  ¿Quieres recibir notificaciones cuando tu citación haya sido registrada en el Tribunal? Descubre cómo suscribirte a las notificaciones...
                </p>
              </div>
            </div>

            {/* Card 2: Search My Ticket */}
            <div
              className={`${styles.cardItem} ${styles.cardItemClickable}`}
              onClick={() => handleStartFlow('search')}
            >
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Buscar mi multa</h2>
              </div>
              <div className={styles.cardGoldLine} />
              <div className={styles.cardBody}>
                <p className={styles.cardText}>
                  ¿No tienes tu multa? Puedes buscar por número de licencia de conducir o número de multa.
                </p>
              </div>
            </div>

            {/* Card 3: Pay My Ticket */}
            <div
              className={`${styles.cardItem} ${styles.cardItemClickable}`}
              onClick={() => handleStartFlow('pay')}
            >
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Pagar mi multa</h2>
              </div>
              <div className={styles.cardGoldLine} />
              <div className={styles.cardBody}>
                <p className={styles.cardText}>
                  ¿Listo para pagar? Explora tus opciones de pago, inscríbete en la escuela de tráfico o solicita un plan de pago.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* User's Traffic Fines List Section */
          <div className={styles.finesListContainer}>
            <div className={styles.finesListHeaderCard}>
              <h2 className={styles.finesListHeaderTitle}>
                {viewMode === 'pay' ? 'Pagar Multas de Tráfico' : 'Mis Citaciones de Tráfico'}
              </h2>
              <div className={styles.finesListHeaderMeta}>
                <span>Titular: <strong>{personaje?.nombre || 'Usuario Registrado'}</strong></span>
                <span>Registros encontrados: <strong>{finesList.length}</strong></span>
              </div>
            </div>

            {finesList.length === 0 ? (
              <div className={styles.emptyStateCard}>
                <div className={styles.emptyStateIcon}>󱪙</div>
                <div className={styles.emptyStateTitle}>
                  {viewMode === 'pay' ? 'Sin multas pendientes' : 'Sin citaciones registradas'}
                </div>
                <div className={styles.emptyStateText}>
                  {viewMode === 'pay'
                    ? `No constan multas pendientes de pago a nombre de ${personaje?.nombre || 'este usuario'}.`
                    : `No constan citaciones de tráfico a nombre de ${personaje?.nombre || 'este usuario'}.`}
                </div>
              </div>
            ) : (
              finesList.map((fine) => {
                const isPaid = Boolean(fine.pagado) || String(fine.estado || '').toLowerCase() === 'pagada'
                return (
                  <div key={fine.id} className={styles.fineCard}>
                    <div className={styles.fineCardHeader}>
                      <span className={styles.fineCardId}>Citación #{fine.id}</span>
                      <span className={`${styles.fineCardBadge} ${isPaid ? styles.badgePaid : styles.badgeUnpaid}`}>
                        {isPaid ? 'PAGADA' : 'PENDIENTE'}
                      </span>
                    </div>
                    <div className={styles.fineCardReason}>
                      {fine.cargos || fine.motivo || fine.razon || fine.descripcion || 'Infracción de tráfico'}
                    </div>
                    <div className={styles.fineCardDetailsRow}>
                      <span>
                        Fecha: {fine.fecha ? new Date(fine.fecha).toLocaleDateString('es-ES') : 'Reciente'}
                      </span>

                      {/* Pay Button when unpaid */}
                      {!isPaid && (
                        <button
                          className={styles.payBtn}
                          onClick={() => handleOpenApplePay(fine)}
                        >
                          Pagar
                        </button>
                      )}

                      <span className={styles.fineCardAmount}>
                        ${(Number(fine.dinero || fine.monto || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })
            )}

            <button className={styles.backBtn} onClick={() => setShowFinesList(false)}>
              ← Volver a opciones de búsqueda
            </button>
          </div>
        )}

        {/* Reusable Apple Pay Bottom Sheet Modal Component */}
        <ApplePaySheet
          isOpen={isApplePayOpen}
          onClose={() => setIsApplePayOpen(false)}
          item={selectedPayItem}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </div>
    </CourtLayout>
  )
}

export default TrafficPage
