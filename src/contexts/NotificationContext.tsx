import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

import notifSound from '@/assets/notification/sound.mp3'

function logToTerminal(...args: any[]) {
  if (typeof window !== 'undefined' && (window.electronAPI as any)?.logTerminal) {
    ;(window.electronAPI as any).logTerminal('[NOTIF-DAEMON]', ...args)
  } else {
    console.log('[NOTIF-DAEMON]', ...args)
  }
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  app?: 'mensajes' | 'banco' | 'multas' | 'dnie' | 'gps' | 'contactos' | 'mapa' | 'system'
  iconUrl?: string
  timeText?: string
  duration?: number
  onClick?: () => void
  created_at: number
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  notify: (item: Omit<NotificationItem, 'id' | 'created_at'>) => string
  dismiss: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider')
  }
  return ctx
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const { personaje } = useAuth()
  const navigate = useNavigate()

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const notify = useCallback(
    (item: Omit<NotificationItem, 'id' | 'created_at'>): string => {
      const id = 'notif_' + Math.random().toString(36).substring(2, 9)
      const newItem: NotificationItem = {
        ...item,
        id,
        created_at: Date.now(),
        duration: item.duration ?? 5000,
      }

      setNotifications((prev) => [newItem, ...prev])

      // Reproducir sonido de notificación
      try {
        const audio = new Audio(notifSound)
        audio.volume = 0.8
        audio.play().catch((err) => {
          logToTerminal('Auto-play aviso sonido:', err)
        })
      } catch (e) {
        logToTerminal('Error al reproducir audio de notificación:', e)
      }

      if (newItem.duration && newItem.duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, newItem.duration)
      }

      return id
    },
    [dismiss],
  )

  // ─── Realtime & Polling Daemon Listeners ───────────────────────────────
  useEffect(() => {
    if (!personaje) return

    const discordId = personaje.discord_id
    if (!discordId) return

    const processedTxIds = new Set<string>()
    const processedMsgIds = new Set<string>()
    const processedMultaIds = new Set<string>()
    const norm = (s: any) => String(s || '').replace(/\s+/g, '').trim()

    // Helper: process a transaction object
    const processTransaction = async (tx: any) => {
      if (!tx || !tx.id || processedTxIds.has(String(tx.id))) return
      processedTxIds.add(String(tx.id))

      logToTerminal('💸 Daemon detectó nueva transacción:', tx)

      try {
        let { data: misCuentas } = await supabase
          .from('cuentas_bancarias')
          .select('numero_cuenta, discord_id')
          .eq('discord_id', String(discordId))

        if (!misCuentas || misCuentas.length === 0) {
          const { data: allCuentas } = await supabase
            .from('cuentas_bancarias')
            .select('numero_cuenta, discord_id')
          misCuentas = (allCuentas || []).filter(
            (c) => String(c.discord_id) === String(discordId),
          )
        }

        const misNumeros = new Set((misCuentas || []).map((c) => norm(c.numero_cuenta)))
        const destNorm = norm(tx.cuenta_destino)
        const origNorm = norm(tx.cuenta_origen)

        const isDestino = misNumeros.has(destNorm)
        const isOrigen = misNumeros.has(origNorm)

        logToTerminal('🏦 Comparación cuentas daemon:', {
          misNumeros: Array.from(misNumeros),
          destNorm,
          origNorm,
          isDestino,
          isOrigen,
        })

        if (isDestino && isOrigen) {
          notify({
            title: 'Chase Bank — Transferencia Propia',
            message: `Movidos $${(tx.monto || 0).toLocaleString()} entre tus cuentas`,
            app: 'banco',
            timeText: 'Ahora',
            onClick: () => navigate('/banco'),
          })
        } else if (isDestino) {
          notify({
            title: 'Chase Bank — Dinero Recibido',
            message: `+$${(tx.monto || 0).toLocaleString()} desde cta. ${tx.cuenta_origen || 'externa'}`,
            app: 'banco',
            timeText: 'Ahora',
            onClick: () => navigate('/banco'),
          })
        } else if (isOrigen) {
          notify({
            title: 'Chase Bank — Transferencia Enviada',
            message: `-$${(tx.monto || 0).toLocaleString()} a cta. ${tx.cuenta_destino || 'externa'}`,
            app: 'banco',
            timeText: 'Ahora',
            onClick: () => navigate('/banco'),
          })
        } else {
          notify({
            title: 'Chase Bank — Dinero Recibido',
            message: `+$${(tx.monto || 0).toLocaleString()} en cta. ${tx.cuenta_destino || ''}`,
            app: 'banco',
            timeText: 'Ahora',
            onClick: () => navigate('/banco'),
          })
        }
      } catch (err) {
        logToTerminal('❌ Error procesando notificación banco:', err)
      }
    }

    // Initial seed: Mark existing records as processed so old history isn't re-notified on page load
    const initSeed = async () => {
      try {
        let { data: initTxs } = await supabase
          .from('transacciones')
          .select('id')
          .order('id', { ascending: false })
          .limit(30)

        if (!initTxs) {
          const res = await supabase.from('transacciones').select('id').limit(30)
          initTxs = res.data
        }

        if (initTxs) {
          initTxs.forEach((t) => processedTxIds.add(String(t.id)))
        }

        const { data: initMsgs } = await supabase
          .from('mensajes')
          .select('id')
          .order('id', { ascending: false })
          .limit(30)
        if (initMsgs) {
          initMsgs.forEach((m) => processedMsgIds.add(String(m.id)))
        }

        const { data: initMultas } = await supabase
          .from('multas')
          .select('id')
          .limit(30)
        if (initMultas) {
          initMultas.forEach((m) => processedMultaIds.add(String(m.id)))
        }
      } catch {
        /* ignore */
      }
    }
    initSeed()

    // 1. WebSocket Realtime Listeners
    const msgChannel = supabase
      .channel(`daemon_msg_${discordId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        async (payload) => {
          const newMsg = payload.new as any
          if (!newMsg || !newMsg.id || processedMsgIds.has(String(newMsg.id))) return
          processedMsgIds.add(String(newMsg.id))

          const isTarget =
            newMsg.receptor_discord_id === discordId ||
            newMsg.receptor_id === personaje.id ||
            newMsg.para === discordId

          if (!isTarget) return

          let emisorNombre = 'Nuevo Mensaje'
          try {
            const emisorId = newMsg.emisor_discord_id || newMsg.de
            if (emisorId) {
              const { data: p } = await supabase
                .from('personajes')
                .select('nombre')
                .eq('discord_id', emisorId)
                .maybeSingle()
              if (p?.nombre) emisorNombre = p.nombre
            }
          } catch {
            /* ignore */
          }

          notify({
            title: emisorNombre,
            message: newMsg.contenido || newMsg.texto || newMsg.mensaje || 'Nuevo mensaje recibido',
            app: 'mensajes',
            timeText: 'Ahora',
            onClick: () => navigate('/mensajes'),
          })
        },
      )
      .subscribe()

    const multasChannel = supabase
      .channel(`daemon_multas_${personaje.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'multas' },
        (payload) => {
          const m = payload.new as any
          if (!m || !m.id || processedMultaIds.has(String(m.id))) return
          processedMultaIds.add(String(m.id))

          if (m.personaje_id === personaje.id || m.discord_id === discordId) {
            notify({
              title: 'Policía — Nueva Multa',
              message: `$${(m.dinero || m.monto || 0).toLocaleString()} — ${m.cargos || m.motivo || 'Sanción aplicada'}`,
              app: 'multas',
              timeText: 'Ahora',
              onClick: () => navigate('/dnie'),
            })
          }
        },
      )
      .subscribe()

    const bancoChannel = supabase
      .channel(`daemon_banco_${discordId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transacciones' },
        (payload) => {
          processTransaction(payload.new)
        },
      )
      .subscribe()

    // 2. Polling Daemon (checks every 2 seconds for newly inserted IDs)
    const pollInterval = setInterval(async () => {
      try {
        let { data: recentTxs, error: pollErr } = await supabase
          .from('transacciones')
          .select('*')
          .order('id', { ascending: false })
          .limit(10)

        if (pollErr || !recentTxs) {
          const res = await supabase.from('transacciones').select('*').limit(10)
          recentTxs = res.data
        }

        if (recentTxs && recentTxs.length > 0) {
          for (const tx of recentTxs) {
            if (!processedTxIds.has(String(tx.id))) {
              await processTransaction(tx)
            }
          }
        }
      } catch {
        /* ignore */
      }
    }, 2000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(multasChannel)
      supabase.removeChannel(bancoChannel)
    }
  }, [personaje, notify, navigate])

  return (
    <NotificationContext.Provider
      value={{ notifications, notify, dismiss, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
