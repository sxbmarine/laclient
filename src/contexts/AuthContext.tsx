import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, getDiscordId } from '@/lib/supabase'
import type { Personaje } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  user: User | null
  personaje: Personaje | null
  loading: boolean
  authError: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshPersonaje: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [personaje, setPersonaje] = useState<Personaje | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const loadPersonaje = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setPersonaje(null)
        return
      }

      const rpcDiscordId = await getDiscordId().catch(() => null)
      const providerId = user.user_metadata?.provider_id
      const subId = user.user_metadata?.sub
      const rawId = user.id

      const candidateIds = Array.from(
        new Set([rpcDiscordId, providerId, subId, rawId].filter(Boolean) as string[])
      )

      console.log('[AuthContext Debug] user:', user)
      console.log('[AuthContext Debug] candidateIds:', candidateIds)

      let foundPersonaje: Personaje | null = null

      if (candidateIds.length > 0) {
        const { data, error } = await supabase
          .from('personajes')
          .select('*')
          .in('discord_id', candidateIds)
          .order('creado_en', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error) {
          console.warn('[AuthContext Debug] Query por discord_id in candidateIds dio error:', error.message)
        } else if (data) {
          foundPersonaje = data
          console.log('[AuthContext Debug] Personaje encontrado por candidato directo:', data)
        }
      }

      // Si no se encuentra por match exacto de candidateIds, traer lista de personajes para analizar
      if (!foundPersonaje) {
        const { data: allPersonajes, error: allErr } = await supabase
          .from('personajes')
          .select('*')
          .order('creado_en', { ascending: false })
          .limit(100)

        console.log('[AuthContext Debug] Lista de personajes en Supabase:', allPersonajes, 'Error:', allErr)

        if (allPersonajes && allPersonajes.length > 0) {
          // 1. Intentar machacando discord_id sin espacios ni sufijos
          foundPersonaje =
            allPersonajes.find((p) => {
              const pId = String(p.discord_id || '').trim()
              return candidateIds.some((c) => String(c).trim() === pId || pId.includes(String(c).trim()) || String(c).trim().includes(pId))
            }) || null

          // 2. Si no hay match de discord_id y solo existe 1 personaje en la base de datos, o coincide usuario_roblox
          if (!foundPersonaje && allPersonajes.length === 1) {
            console.log('[AuthContext Debug] Solo existe 1 personaje en Supabase, asignando automáticamente:', allPersonajes[0])
            foundPersonaje = allPersonajes[0]
          }
        }
      }

      console.log('[AuthContext Debug] Personaje final asignado:', foundPersonaje)
      setPersonaje(foundPersonaje)
    } catch (err) {
      console.error('Excepción al cargar personaje:', err)
      setPersonaje(null)
    }
  }, [])

  const refreshPersonaje = useCallback(async () => {
    if (session) await loadPersonaje()
  }, [session, loadPersonaje])

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        setSession(current)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error obteniendo sesión:', err)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      loadPersonaje()
    } else {
      setPersonaje(null)
    }
  }, [session, loadPersonaje])

  useEffect(() => {
    if (!window.electronAPI) return

    const unsubscribe = window.electronAPI.onAuthTokens(
      async ({ accessToken, refreshToken }) => {
        setAuthError(null)
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) setAuthError(error.message)
      },
    )

    return () => unsubscribe()
  }, [])

  const login = useCallback(async () => {
    setAuthError(null)
    if (!window.electronAPI) {
      setAuthError('Esta app debe ejecutarse en Electron')
      return
    }
    try {
      await window.electronAPI.loginWithDiscord()
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setPersonaje(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      personaje,
      loading,
      authError,
      login,
      logout,
      refreshPersonaje,
    }),
    [session, personaje, loading, authError, login, logout, refreshPersonaje],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
