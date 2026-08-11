export interface CodigoPenalItem {
  id: number
  nombre: string
  dinero: number
  tiempo: number
  categoria?: string
  descripcion?: string
  clase?: string
}

export interface AntecedenteItem {
  id?: string
  dni: string
  cargos_aplicados: number[] | string[] | any
  fecha?: string
  agente_dni: string
  multa_total?: number
  tiempo_total?: number
  detalles?: string
  tipo?: 'traffic' | 'criminal' | string
}

export interface PoliciaItem {
  id?: string
  dni: string
  nombre_completo: string
  placa: string
  departamento?: 'LSPD' | 'SDSO' | 'SASP' | 'SAHP' | string
  rango?: string
  permisos: string[] | any
  estado: '10-8' | '10-7' | '10-97' | '10-23' | 'codigo3' | string
  llamada_activa?: string | null
}

export interface BuscadoItem {
  id?: string
  dni: string
  nombre_sujeto: string
  motivo: string
  agente_dni: string
  nivel_peligrosidad?: 'ALTA' | 'MEDIA' | 'BAJA' | string
  foto_url?: string | null
  estado?: 'ACTIVO' | 'CAPTURADO' | 'CANCELADO' | string
  fecha?: string
}

export interface InformeItem {
  id?: string
  titulo: string
  agente: string
  implicados: string[] | any
  descripcion: string
  pruebas_urls?: string[] | any
  estado?: 'ABIERTO' | 'EN_PROCESO' | 'CERRADO' | string
  fecha?: string
}

export interface LlamadaItem {
  id?: string
  numero: number
  coordenadas: number[] | any
  estado: boolean // false = activa / en progreso, true = resuelta
  hora?: string
  descripcion?: string
  lugar?: string
  notas?: string
  unidades?: string[] | any
  equipo?: string
  updated_at?: string
}
