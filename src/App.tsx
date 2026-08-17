import React from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { DeviceProvider, useDevice } from '@/contexts/DeviceContext'
import { PhoneFrame } from '@/components/PhoneFrame'
import { TabletFrame } from '@/components/TabletFrame'
import { HomeScreen } from '@/components/HomeScreen'
import { LoginScreen } from '@/apps/LoginScreen'
import { BancoApp } from '@/apps/BancoApp'
import { DNIeApp } from '@/apps/DNIeApp'
import { MapaApp } from '@/apps/MapaApp'
import { ContactosApp } from '@/apps/ContactosApp'
import { MensajesApp } from '@/apps/MensajesApp'
import { GPSApp } from '@/apps/GPSApp'
import { AjustesApp } from '@/apps/AjustesApp'
import { ChromeApp } from '@/apps/ChromeApp'
import { OnboardingScreen } from '@/apps/OnboardingScreen'
import { TabletNotificationProvider } from '@/contexts/TabletNotificationContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, personaje, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!personaje) return <Navigate to="/onboarding" replace />

  return <>{children}</>
}

function PhoneAppRoutes() {
  const { session, personaje, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to={personaje ? '/' : '/onboarding'} replace />
          ) : (
            <LoginScreen />
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          session ? (
            personaje ? <Navigate to="/" replace /> : <OnboardingScreen />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeScreen />
          </ProtectedRoute>
        }
      />
      <Route path="/banco" element={<ProtectedRoute><BancoApp /></ProtectedRoute>} />
      <Route path="/dnie" element={<ProtectedRoute><DNIeApp /></ProtectedRoute>} />
      <Route path="/mapa" element={<ProtectedRoute><MapaApp /></ProtectedRoute>} />
      <Route path="/contactos" element={<ProtectedRoute><ContactosApp /></ProtectedRoute>} />
      <Route path="/mensajes" element={<ProtectedRoute><MensajesApp /></ProtectedRoute>} />
      <Route path="/gps" element={<ProtectedRoute><GPSApp /></ProtectedRoute>} />
      <Route path="/ajustes" element={<ProtectedRoute><AjustesApp /></ProtectedRoute>} />
      <Route path="/chrome" element={<ProtectedRoute><ChromeApp /></ProtectedRoute>} />
      <Route path="/chrome/*" element={<ProtectedRoute><ChromeApp /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function MainContainer() {
  const { deviceMode } = useDevice()

  if (deviceMode === 'tablet') {
    return <TabletFrame />
  }

  return (
    <PhoneFrame>
      <PhoneAppRoutes />
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DeviceProvider>
          <NotificationProvider>
            <TabletNotificationProvider>
              <MainContainer />
            </TabletNotificationProvider>
          </NotificationProvider>
        </DeviceProvider>
      </AuthProvider>
    </HashRouter>
  )
}
