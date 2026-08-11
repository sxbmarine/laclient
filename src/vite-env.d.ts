/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  electronAPI?: {
    loginWithDiscord: () => Promise<{ ok: boolean }>
    onAuthTokens: (callback: (tokens: { accessToken: string; refreshToken: string }) => void) => () => void
    minimizeWindow: () => Promise<void>
    closeWindow: () => Promise<void>
    setAlwaysOnTop: (flag: boolean) => Promise<boolean>
    getAlwaysOnTop: () => Promise<boolean>
    getAppVersion: () => Promise<string>
  }
}
