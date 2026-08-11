export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ElectronAPI {
  loginWithDiscord: () => Promise<{ ok: boolean }>
  onAuthTokens: (callback: (tokens: AuthTokens) => void) => () => void
  minimizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  setAlwaysOnTop?: (flag: boolean) => Promise<boolean>
  getAlwaysOnTop?: () => Promise<boolean>
  setDeviceMode?: (mode: 'phone' | 'tablet') => Promise<void>
  getAppVersion: () => Promise<string>
  logTerminal?: (...args: any[]) => Promise<void>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
