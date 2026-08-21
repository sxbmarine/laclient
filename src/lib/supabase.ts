import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://pwgicqmwroutwnitkalo.supabase.co'
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Z2ljcW13cm91dHduaXRrYWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4ODc5MDAsImV4cCI6MjEwMDQ2MzkwMH0.Qm482IkucVKdXxPv19Vds2tTcZnxqOnY3XxTfxN_BvY'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
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
