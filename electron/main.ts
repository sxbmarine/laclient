import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const PROTOCOL = 'laclient'
const REDIRECT_URI = `${PROTOCOL}://auth/callback`

let mainWindow: BrowserWindow | null = null
let pendingAuthUrl: string | null = null

function getSupabaseAdmin() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno')
  }
  return createClient(url, key)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 860,
    minWidth: 380,
    minHeight: 700,
    frame: false,
    resizable: true,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  const devUrl = import.meta.env.VITE_DEV_SERVER_URL as string | undefined
  if (devUrl) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function sendTokensToRenderer(accessToken: string, refreshToken: string) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('auth:tokens', { accessToken, refreshToken })
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
}

function handleDeepLink(url: string) {
  console.log('[DeepLink] Received URL:', url)
  if (!url.startsWith(`${PROTOCOL}://`)) return

  try {
    const parsed = new URL(url)
    console.log('[DeepLink] Parsed — host:', parsed.host, 'pathname:', parsed.pathname, 'hash:', parsed.hash, 'search:', parsed.search)

    // On Windows, custom protocols parse differently:
    // "laclient://auth/callback" may yield host="auth", pathname="/callback"
    // or pathname="//auth/callback" depending on the platform.
    const fullPath = (parsed.host + parsed.pathname).replace(/^\/+/, '')
    if (!fullPath.includes('auth/callback') && !fullPath.includes('auth\\callback')) {
      console.log('[DeepLink] Not an auth callback, ignoring. fullPath:', fullPath)
      return
    }

    // Tokens can arrive as hash fragment OR query parameters
    let accessToken: string | null = null
    let refreshToken: string | null = null

    // Try hash fragment first (#access_token=...&refresh_token=...)
    if (parsed.hash) {
      const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash
      const hashParams = new URLSearchParams(hash)
      accessToken = hashParams.get('access_token')
      refreshToken = hashParams.get('refresh_token')
    }

    // Fallback to query parameters (?access_token=...&refresh_token=...)
    if (!accessToken || !refreshToken) {
      accessToken = parsed.searchParams.get('access_token') ?? accessToken
      refreshToken = parsed.searchParams.get('refresh_token') ?? refreshToken
    }

    // Last resort: parse the raw URL string for tokens
    if (!accessToken || !refreshToken) {
      const rawMatch = url.match(/access_token=([^&#]+)/)
      const rawRefresh = url.match(/refresh_token=([^&#]+)/)
      if (rawMatch) accessToken = decodeURIComponent(rawMatch[1])
      if (rawRefresh) refreshToken = decodeURIComponent(rawRefresh[1])
    }

    console.log('[DeepLink] Tokens found — access:', !!accessToken, 'refresh:', !!refreshToken)

    if (accessToken && refreshToken) {
      sendTokensToRenderer(accessToken, refreshToken)
    } else {
      console.warn('[DeepLink] Missing tokens in callback URL')
    }
  } catch (err) {
    console.error('[DeepLink] Error parsing URL:', err)
  }
}

function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ])
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    console.log('[SecondInstance] argv:', argv)
    const deepLink = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    console.log('[SecondInstance] deepLink:', deepLink)
    if (deepLink) handleDeepLink(deepLink)

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    registerProtocol()
    createWindow()

    const deepLink = process.argv.find((arg) => arg.startsWith(`${PROTOCOL}://`))
    if (deepLink) handleDeepLink(deepLink)
  })
}

app.on('open-url', (event, url) => {
  event.preventDefault()
  handleDeepLink(url)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

ipcMain.handle('auth:login', async () => {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  })

  if (error) throw error
  if (!data.url) throw new Error('No se recibió URL de OAuth')

  pendingAuthUrl = data.url
  await shell.openExternal(data.url)
  return { ok: true }
})

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('window:setAlwaysOnTop', (_event, flag: boolean) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(flag, 'screen-saver')
    return mainWindow.isAlwaysOnTop()
  }
  return flag
})

ipcMain.handle('window:getAlwaysOnTop', () => {
  return mainWindow?.isAlwaysOnTop() ?? false
})

ipcMain.handle('app:getVersion', () => app.getVersion())

ipcMain.handle('log:terminal', (_event, ...args) => {
  console.log('[CLIENT-LOG]', ...args)
})

export { pendingAuthUrl }
