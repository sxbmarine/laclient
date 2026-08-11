import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env',
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

export async function getDiscordId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('discord_id_actual')
  if (error) {
    console.error('Error obteniendo discord_id:', error.message)
    return null
  }
  return data as string | null
}

export function generatePhoneNumber(): string {
  const mid = Math.floor(100 + Math.random() * 900)
  const last = Math.floor(1000 + Math.random() * 9000)
  return `213${mid}${last}`
}

export function formatPhoneNumber(numero: string | null | undefined): string {
  if (!numero) return 'N/A'
  const cleaned = numero.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('213')) {
    const mid = cleaned.slice(3, 6)
    const last = cleaned.slice(6)
    return `+1 (213) ${mid}-${last}`
  }
  if (cleaned.length === 7) {
    const mid = cleaned.slice(0, 3)
    const last = cleaned.slice(3)
    return `+1 (213) ${mid}-${last}`
  }
  return numero
}

export function generateIdNumber(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter = letters[Math.floor(Math.random() * letters.length)]
  const digits = Math.floor(1000000 + Math.random() * 9000000).toString()
  return `${letter}${digits}`
}
