import React, { createContext, useContext, useState } from 'react'

export type DeviceMode = 'phone' | 'tablet'

interface DeviceContextType {
  deviceMode: DeviceMode
  setDeviceMode: (mode: DeviceMode) => void
  openTablet: () => void
  openPhone: () => void
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined)

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>('phone')

  const setDeviceMode = (mode: DeviceMode) => {
    setDeviceModeState(mode)
    if ((window.electronAPI as any)?.setDeviceMode) {
      ;(window.electronAPI as any).setDeviceMode(mode)
    }
  }

  const openTablet = () => setDeviceMode('tablet')
  const openPhone = () => setDeviceMode('phone')

  return (
    <DeviceContext.Provider value={{ deviceMode, setDeviceMode, openTablet, openPhone }}>
      {children}
    </DeviceContext.Provider>
  )
}

export function useDevice() {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider')
  }
  return context
}
