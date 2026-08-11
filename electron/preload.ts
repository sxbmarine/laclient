import { contextBridge, ipcRenderer } from 'electron'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  loginWithDiscord: (): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('auth:login'),

  onAuthTokens: (callback: (tokens: AuthTokens) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tokens: AuthTokens) => {
      callback(tokens)
    }
    ipcRenderer.on('auth:tokens', handler)
    return () => ipcRenderer.removeListener('auth:tokens', handler)
  },

  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (flag: boolean): Promise<boolean> =>
    ipcRenderer.invoke('window:setAlwaysOnTop', flag),
  getAlwaysOnTop: (): Promise<boolean> =>
    ipcRenderer.invoke('window:getAlwaysOnTop'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  logTerminal: (...args: any[]): Promise<void> => ipcRenderer.invoke('log:terminal', ...args),
})
