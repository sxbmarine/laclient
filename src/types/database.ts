export type RolTipo = 'civil' | 'policia' | 'admin'

export interface Usuario {
  id: string
  discord_id: string
  roblox?: string | null
  created_at: string
}

export interface Rol {
  discord_id: string
  rol: RolTipo
  created_at: string
}

export interface Personaje {
  id: string
  discord_id: string
  creado_en: string
  numero: string | null
  idnumber?: string | null
  nombre: string
  fecha_nacimiento: string | null
  genero: string | null
  domicilio: string | null
  nacionalidad: string | null
  usuario_roblox: string | null
}

export interface CuentaBancaria {
  id: number
  discord_id: string
  banco: string
  numero_cuenta: string
  saldo: number
  pin: string
  activa: boolean
  ultimo_interes: string | null
  created_at: string
}

export interface Transaccion {
  id: number
  cuenta_origen: string
  cuenta_destino: string
  monto: number
  concepto: string | null
  fecha: string
}

export interface Multa {
  id: string
  personaje_id: string
  cargos: string
  dinero: number
  pagado: boolean
  fecha: string
}

export interface Contacto {
  id: number
  discord_id: string
  numero_telefono: string
  nombre: string
  created_at: string
}

export interface Mensaje {
  id: number
  emisor_discord_id: string
  receptor_discord_id: string
  contenido: string
  leido: boolean
  created_at: string
}

export interface GpsCompartido {
  id: number
  discord_id_emisor: string
  discord_id_receptor: string
  activo: boolean
  created_at: string
}

export interface ErlcPlayer {
  player: string
  team: string
  location: string
  callsign: string | null
  personaje?: Personaje
}

export const BANCOS = ['Chase Bank', 'Bank of America', 'Citibank'] as const
export type BancoNombre = (typeof BANCOS)[number]

export interface AppInfo {
  id: string
  name: string
  icon: string
  color: string
  route: string
}
