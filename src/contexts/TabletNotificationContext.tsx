import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface TabletNotificationOptions {
  titulo: string
  texto: string
  icono: string
  color: string
  duracion?: number // en milisegundos, por defecto 5000ms
}

export interface TabletNotificationItem extends TabletNotificationOptions {
  id: string
  createdAt: number
  isExiting?: boolean
}

interface TabletNotificationContextType {
  notifications: TabletNotificationItem[]
  sendNotification: (
    optionsOrTitle: TabletNotificationOptions | string,
    texto?: string,
    icono?: string,
    color?: string,
    duracion?: number
  ) => string
  dismissNotification: (id: string) => void
}

const TabletNotificationContext = createContext<TabletNotificationContextType | undefined>(undefined)

export function useTabletNotification() {
  const context = useContext(TabletNotificationContext)
  if (!context) {
    throw new Error('useTabletNotification debe ser usado dentro de TabletNotificationProvider')
  }
  return context
}

export function TabletNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<TabletNotificationItem[]>([])

  const dismissNotification = useCallback((id: string) => {
    // Marcar como saliendo para animación suave de slideOut
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isExiting: true } : n))
    )

    // Eliminar definitivamente después de la animación de slideOut (300ms)
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 300)
  }, [])

  const sendNotification = useCallback(
    (
      optionsOrTitle: TabletNotificationOptions | string,
      texto?: string,
      icono?: string,
      color?: string,
      duracion?: number
    ): string => {
      let options: TabletNotificationOptions

      if (typeof optionsOrTitle === 'object' && optionsOrTitle !== null) {
        options = optionsOrTitle
      } else {
        options = {
          titulo: optionsOrTitle,
          texto: texto || '',
          icono: icono || '🔔',
          color: color || '#2997ff',
          duracion,
        }
      }

      const id = 'tab_notif_' + Math.random().toString(36).substring(2, 9)
      const newItem: TabletNotificationItem = {
        ...options,
        id,
        createdAt: Date.now(),
        duracion: options.duracion || 5000,
      }

      setNotifications((prev) => [...prev, newItem])

      // Auto dismiss después de la duración asignada
      if (newItem.duracion && newItem.duracion > 0) {
        setTimeout(() => {
          dismissNotification(id)
        }, newItem.duracion)
      }

      return id
    },
    [dismissNotification]
  )

  return (
    <TabletNotificationContext.Provider
      value={{ notifications, sendNotification, dismissNotification }}
    >
      {children}
    </TabletNotificationContext.Provider>
  )
}
