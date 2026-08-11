const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isDev = typeof window !== 'undefined' && window.location.origin.includes('localhost:5173')
const USERS_API_BASE = isDev ? '/roblox-users' : 'https://users.roblox.com'
const THUMBNAILS_API_BASE = isDev ? '/roblox-thumbnails' : 'https://thumbnails.roblox.com'

/**
 * Obtiene el ID de usuario de Roblox a partir de un nombre de usuario.
 * Reintenta hasta 5 veces en caso de rate limiting.
 */
export async function getRobloxUserId(username: string): Promise<number | null> {
  const normalized = username.replace(/^@/, '').replace(/\s+/g, '').trim()
  if (!normalized) return null

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const userRes = await fetch(`${USERS_API_BASE}/v1/usernames/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [normalized], excludeBannedUsers: false }),
      })
      if (!userRes.ok) throw new Error(`HTTP ${userRes.status}`)
      const userData = await userRes.json()

      if (userData.errors?.some((e: { code: number }) => e.code === 4)) {
        await sleep(1000 * (attempt + 1))
        continue
      }

      return userData.data?.[0]?.id ?? null
    } catch (err) {
      console.warn('Aviso obteniendo userId de Roblox:', err)
      await sleep(500)
    }
  }

  return null
}

/**
 * Obtiene la URL del headshot de un usuario de Roblox.
 * Primero solicita la generación del thumbnail, luego lo consulta en polling.
 */
export async function fetchHeadshotUrl(
  userId: number,
  maxAttempts = 10,
  delayMs = 400
): Promise<string | null> {
  try {
    await fetch(`${THUMBNAILS_API_BASE}/v1/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          requestId: '0',
          targetId: userId,
          type: 'AvatarHeadShot',
          size: '150x150',
          format: 'Png',
        },
      ]),
    })
  } catch (err) {
    console.warn('Aviso batch thumbnail Roblox:', err)
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const avatarRes = await fetch(
        `${THUMBNAILS_API_BASE}/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
      )
      if (avatarRes.ok) {
        const data = await avatarRes.json()
        const entry = data.data?.[0]

        if (entry?.state === 'Completed' && entry.imageUrl) {
          return entry.imageUrl
        }
        if (entry?.state === 'Error' || entry?.state === 'Blocked') {
          return null
        }
      }
    } catch (err) {
      console.warn('Aviso headshot Roblox:', err)
    }

    await sleep(delayMs)
  }

  return null
}

// In-memory cache for avatar URLs to avoid repeated fetch calls
const avatarCache = new Map<string, string>()

/**
 * Obtiene la URL directa CDN del avatar de Roblox a partir del username.
 */
export async function getRobloxAvatarUrl(username: string): Promise<string | null> {
  const normalized = username.replace(/^@/, '').trim()
  if (!normalized) return null

  if (avatarCache.has(normalized)) {
    return avatarCache.get(normalized)!
  }

  try {
    const userId = await getRobloxUserId(normalized)
    if (!userId) {
      return `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(normalized)}&width=420&height=420&format=png`
    }

    const url = await fetchHeadshotUrl(userId)
    if (url) {
      avatarCache.set(normalized, url)
      return url
    }
  } catch {
    // Fallback silencioso
  }

  return `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(normalized)}&width=420&height=420&format=png`
}
