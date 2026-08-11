import { supabase } from '@/lib/supabase'
import type {
  CodigoPenalItem,
  AntecedenteItem,
  PoliciaItem,
  BuscadoItem,
  InformeItem,
  LlamadaItem,
} from '@/types/mdt'

export interface CiudadanoProfile {
  dni: string
  nombre: string
  apellido: string
  nombreCompleto: string
  robloxUser?: string
  avatarUrl?: string
  licenciaConducir: boolean
  licenciaArmas: boolean
  multasPendientes: number
  antecedentesCount: number
}

export interface VehiculoProfile {
  patente: string
  modelo: string
  propietarioNombre: string
  propietarioDni: string
  itv: boolean
  seguro: boolean
  embargado: boolean
  multasPendientes: number
}

/* ─── CODIGO PENAL ────────────────────────────────────────────── */
export async function getCodigoPenal(): Promise<CodigoPenalItem[]> {
  try {
    const { data, error } = await supabase
      .from('codigopenal')
      .select('*')
      .order('id', { ascending: true })

    if (error || !data) {
      console.warn('Error o tabla vacia en codigopenal:', error?.message)
      return []
    }
    return data
  } catch (err) {
    console.error('Error cargando codigo penal:', err)
    return []
  }
}

/* ─── ANTECEDENTES ────────────────────────────────────────────── */
export async function getAntecedentesByDNI(dni: string): Promise<AntecedenteItem[]> {
  if (!dni) return []
  try {
    const { data, error } = await supabase
      .from('antecedentes')
      .select('*')
      .eq('dni', dni.trim().toUpperCase())
      .order('fecha', { ascending: false })

    if (error || !data) {
      return []
    }
    return data
  } catch (err) {
    console.error('Error cargando antecedentes:', err)
    return []
  }
}

export async function createMultaForAntecedente(antecedente: AntecedenteItem, item: Omit<AntecedenteItem, 'id'>) {
  if (!antecedente || !antecedente.id) return null

  // Formatear lista de cargos para la entrada de la multa
  const cargosStr = Array.isArray(antecedente.cargos_aplicados)
    ? antecedente.cargos_aplicados.map((c: any) => `§${c}`).join(', ')
    : String(antecedente.cargos_aplicados || '')

  const recordType = item.tipo || antecedente.tipo || 'criminal'
  const amount = Number(antecedente.multa_total || item.multa_total || 0)

  // Datos para insertar en la tabla 'multas' con referencia id_antecedente
  const fineData: any = {
    id_antecedente: antecedente.id, // Columna UUID referencia a antecedentes
    dni: antecedente.dni,
    cargos: cargosStr || 'Infracción Registrada',
    dinero: amount,
    monto: amount,
    tipo: recordType,
    pagado: false,
    estado: 'pendiente',
    fecha: antecedente.fecha || new Date().toISOString(),
    detalles: antecedente.detalles || '',
    agente: antecedente.agente_dni || '',
  }

  try {
    // 1. Intentar inserción en la tabla multas
    const { data, error } = await supabase
      .from('multas')
      .insert([fineData])
      .select()

    if (!error && data && data.length > 0) {
      console.log('Multa registrada con éxito en la tabla multas:', data[0])
      return data[0]
    }

    console.warn('Reintentando inserción simplificada en multas:', error?.message)
    // Fallback: Si alguna columna opcional no existiera en la tabla multas
    const { monto, agente, ...fallbackFineData } = fineData

    const { data: fbData, error: fbErr } = await supabase
      .from('multas')
      .insert([fallbackFineData])
      .select()

    if (fbErr) {
      console.error('Error insertando en la tabla multas:', fbErr.message)
      return null
    }

    return fbData?.[0] || true
  } catch (err) {
    console.error('Excepción al crear la multa:', err)
    return null
  }
}

export async function addAntecedente(item: Omit<AntecedenteItem, 'id'>): Promise<AntecedenteItem | null> {
  const cleanItem = {
    ...item,
    dni: item.dni ? item.dni.trim().toUpperCase() : '',
  }

  try {
    let createdRecord: AntecedenteItem | null = null

    // 1. Intentar inserción directa en la tabla 'antecedentes'
    const { data, error } = await supabase
      .from('antecedentes')
      .insert([cleanItem])
      .select()

    if (!error && data && data.length > 0) {
      createdRecord = data[0]
    } else {
      // 2. Fallback sin la columna 'tipo' por si no existe en la tabla 'antecedentes'
      const { tipo, ...restItem } = cleanItem as any
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('antecedentes')
        .insert([restItem])
        .select()

      if (fallbackErr) {
        console.error('Error insertando antecedente en Supabase (fallback):', fallbackErr.message)
        alert(`⚠️ Error al guardar el antecedente en Supabase: ${fallbackErr.message || fallbackErr.details}`)
        return null
      }

      if (fallbackData && fallbackData.length > 0) {
        createdRecord = fallbackData[0]
      }
    }

    // 3. Crear también el registro correspondiente en la tabla 'multas' enlazado por 'id_antecedente'
    if (createdRecord && createdRecord.id) {
      await createMultaForAntecedente(createdRecord, item)
    }

    return createdRecord
  } catch (err: any) {
    console.error('Excepción al insertar antecedente:', err)
    alert(`⚠️ Error inesperado en la base de datos: ${err?.message || err}`)
    return null
  }
}

/* ─── POLICIAS ────────────────────────────────────────────────── */
export async function getPolicias(): Promise<PoliciaItem[]> {
  try {
    const { data, error } = await supabase
      .from('policias')
      .select('*')
      .order('nombre_completo', { ascending: true })

    if (error || !data) {
      console.warn('Error o tabla vacia en policias:', error?.message)
      return []
    }
    return data
  } catch (err) {
    console.error('Error cargando policias:', err)
    return []
  }
}

export async function updatePoliciaEstado(dni: string, estado: string, llamadaActiva?: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('policias')
    .update({ estado, llamada_activa: llamadaActiva ?? null })
    .eq('dni', dni)

  if (error) {
    console.error('Error actualizando estado policia:', error.message)
    return false
  }
  return true
}

export async function updatePoliciaInfo(dni: string, updates: Partial<PoliciaItem>): Promise<boolean> {
  const { error } = await supabase
    .from('policias')
    .update(updates)
    .eq('dni', dni)

  if (error) {
    console.error('Error actualizando info de policia:', error.message)
    return false
  }
  return true
}

export async function checkOfficerAccess(
  dni?: string | null,
  personajeName?: string | null
): Promise<PoliciaItem | null> {
  const cleanDni = (dni || '').trim().toUpperCase()
  const cleanName = (personajeName || '').trim()

  if (!cleanDni && !cleanName) return null

  try {
    // 1. Try matching by DNI in Supabase policias table
    if (cleanDni) {
      const { data: dniMatch, error: dniErr } = await supabase
        .from('policias')
        .select('*')
        .or(`dni.ilike.${cleanDni},dni.ilike.%${cleanDni}%`)
        .limit(1)
        .maybeSingle()

      if (dniErr) {
        console.warn('Consulta DNI policia:', dniErr.message)
      }

      if (dniMatch) {
        return dniMatch as PoliciaItem
      }
    }

    // 2. Try matching by Character Name in Supabase policias table
    if (cleanName) {
      const { data: nameMatch, error: nameErr } = await supabase
        .from('policias')
        .select('*')
        .ilike('nombre_completo', `%${cleanName}%`)
        .limit(1)
        .maybeSingle()

      if (nameErr) {
        console.warn('Consulta Nombre policia:', nameErr.message)
      }

      if (nameMatch) {
        return nameMatch as PoliciaItem
      }
    }
  } catch (err) {
    console.error('Error verificando acceso de policia en Supabase:', err)
  }

  return null
}

export async function addPolicia(policia: Omit<PoliciaItem, 'id'>): Promise<PoliciaItem | null> {
  const { data, error } = await supabase
    .from('policias')
    .insert([policia])
    .select()
    .single()

  if (error) {
    console.error('Error creando acceso de policia en Supabase:', error.message)
    return null
  }
  return data
}

export async function deletePolicia(dni: string): Promise<boolean> {
  const { error } = await supabase
    .from('policias')
    .delete()
    .eq('dni', dni)

  if (error) {
    console.error('Error eliminando policia en Supabase:', error.message)
    return false
  }
  return true
}

/* ─── BUSCADOS ────────────────────────────────────────────────── */
export async function getBuscados(): Promise<BuscadoItem[]> {
  try {
    const { data, error } = await supabase
      .from('buscados')
      .select('*')
      .eq('estado', 'ACTIVO')
      .order('fecha', { ascending: false })

    if (error || !data) {
      return []
    }
    return data
  } catch (err) {
    console.error('Error cargando buscados:', err)
    return []
  }
}

export async function addBuscado(item: Omit<BuscadoItem, 'id'>): Promise<BuscadoItem | null> {
  const { data, error } = await supabase
    .from('buscados')
    .insert([item])
    .select()
    .single()

  if (error) {
    console.error('Error insertando buscado en Supabase:', error.message)
    return null
  }
  return data
}

export async function deleteBuscado(idOrDni: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('buscados')
      .delete()
      .or(`id.eq.${idOrDni},dni.eq.${idOrDni}`)

    if (error) {
      await supabase
        .from('buscados')
        .update({ estado: 'CANCELADO' })
        .eq('dni', idOrDni)
    }
    return true
  } catch (err) {
    console.error('Error eliminando buscado:', err)
    return false
  }
}

/* ─── INFORMES ────────────────────────────────────────────────── */
export async function getInformes(): Promise<InformeItem[]> {
  try {
    const { data, error } = await supabase
      .from('informes')
      .select('*')
      .order('fecha', { ascending: false })

    if (error || !data) {
      return []
    }
    return data
  } catch (err) {
    console.error('Error cargando informes:', err)
    return []
  }
}

export async function addInforme(item: Omit<InformeItem, 'id'>): Promise<InformeItem | null> {
  const { data, error } = await supabase
    .from('informes')
    .insert([item])
    .select()
    .single()

  if (error) {
    console.error('Error insertando informe en Supabase:', error.message)
    return null
  }
  return data
}

/* ─── BUSQUEDA NCIC DE CIUDADANOS ─────────────────────────────── */
export async function searchCiudadano(query: string): Promise<CiudadanoProfile | null> {
  if (!query) return null
  const cleanQ = query.trim().toLowerCase()

  try {
    const { data: pData } = await supabase
      .from('personajes')
      .select('*')
      .or(`idnumber.ilike.%${cleanQ}%,numero.ilike.%${cleanQ}%,nombre.ilike.%${cleanQ}%`)
      .limit(1)

    if (pData && pData.length > 0) {
      const p = pData[0]
      const dni = p.idnumber || p.numero || cleanQ.toUpperCase()
      const name = p.nombre || 'Ciudadano Registrado'

      const { data: mData } = await supabase
        .from('multas')
        .select('id')
        .eq('pagado', false)

      const antecedentes = await getAntecedentesByDNI(dni)

      const cleanRobloxUser = (p.usuario_roblox || '').replace(/^@/, '').replace(/\s+/g, '').trim()

      return {
        dni,
        nombre: p.nombre || 'Ciudadano',
        apellido: '',
        nombreCompleto: name,
        robloxUser: p.usuario_roblox,
        avatarUrl: cleanRobloxUser
          ? `https://www.roblox.com/headshot-thumbnail/image?userName=${encodeURIComponent(cleanRobloxUser)}&width=420&height=420&format=png`
          : undefined,
        licenciaConducir: true,
        licenciaArmas: false,
        multasPendientes: mData?.length || 0,
        antecedentesCount: antecedentes.length,
      }
    }
  } catch (e) {
    console.error('Error buscando ciudadano en Supabase:', e)
  }

  return null
}

/* ─── BUSQUEDA REGISTRO DE VEHICULOS ──────────────────────────── */
export async function searchVehiculo(plateQuery: string): Promise<VehiculoProfile | null> {
  if (!plateQuery) return null
  const cleanP = plateQuery.trim().toUpperCase()

  try {
    const { data: vData } = await supabase
      .from('vehiculos')
      .select('*')
      .ilike('patente', `%${cleanP}%`)
      .limit(1)

    if (vData && vData.length > 0) {
      const v = vData[0]
      return {
        patente: v.patente || cleanP,
        modelo: v.modelo || 'Vehículo Registrado',
        propietarioNombre: v.dueno_nombre || 'Propietario Registrado',
        propietarioDni: v.dueno_dni || 'N/A',
        itv: v.itv ?? true,
        seguro: v.seguro ?? true,
        embargado: Boolean(v.embargado),
        multasPendientes: 0,
      }
    }
  } catch (e) {
    console.error('Error buscando vehiculo en Supabase:', e)
  }

  return null
}

/* ─── LLAMADAS CAD (ERLC EMERGENCY CALLS) ─────────────────────── */
export async function getLlamadas(): Promise<LlamadaItem[]> {
  try {
    const { data, error } = await supabase
      .from('llamadas')
      .select('*')
      .order('numero', { ascending: false })

    if (error || !data) {
      console.warn('Error cargando llamadas de Supabase:', error?.message)
      return []
    }
    return data as LlamadaItem[]
  } catch (err) {
    console.error('Error al obtener llamadas:', err)
    return []
  }
}

export async function updateLlamadaEstado(numero: number, estado: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('llamadas')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('numero', numero)

    if (error) {
      console.error('Error actualizando estado de llamada:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('Error en updateLlamadaEstado:', e)
    return false
  }
}

export async function updateLlamadaNotas(numero: number, notas: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('llamadas')
      .update({ notas, updated_at: new Date().toISOString() })
      .eq('numero', numero)

    if (error) {
      console.error('Error actualizando notas de llamada:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('Error en updateLlamadaNotas:', e)
    return false
  }
}

export async function toggleUnidadLlamada(numero: number, unidad: string): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from('llamadas')
      .select('unidades')
      .eq('numero', numero)
      .maybeSingle()

    let currentUnits: string[] = Array.isArray(current?.unidades) ? current.unidades : []
    const exists = currentUnits.includes(unidad)

    let updatedUnits: string[] = []
    if (exists) {
      updatedUnits = currentUnits.filter((u) => u !== unidad)
    } else {
      updatedUnits = [...currentUnits, unidad]
    }

    const { error } = await supabase
      .from('llamadas')
      .update({ unidades: updatedUnits, updated_at: new Date().toISOString() })
      .eq('numero', numero)

    if (error) {
      console.error('Error alternando unidad en llamada:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.error('Error en toggleUnidadLlamada:', e)
    return false
  }
}

export async function syncEmergencyCallsFromERLC(emergencyCalls: any[]): Promise<boolean> {
  if (!Array.isArray(emergencyCalls) || emergencyCalls.length === 0) return true

  try {
    for (const call of emergencyCalls) {
      const callNumber = Number(call.CallNumber || call.numero)
      if (!callNumber) continue

      const startedAt = call.StartedAt
        ? new Date(Number(call.StartedAt) * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

      const coords = Array.isArray(call.Position) ? call.Position : [0, 0]
      const team = call.Team || 'Police'
      const desc = call.Description || 'Llamada de Emergencia'
      const place = call.PositionDescriptor || 'Ubicación desconocida'

      // Check if call already exists in Supabase to preserve notas and unidades
      const { data: existing } = await supabase
        .from('llamadas')
        .select('*')
        .eq('numero', callNumber)
        .maybeSingle()

      if (!existing) {
        await supabase.from('llamadas').insert([
          {
            numero: callNumber,
            coordenadas: coords,
            estado: false,
            hora: startedAt,
            descripcion: desc,
            lugar: place,
            notas: '',
            unidades: [],
            equipo: team,
            updated_at: new Date().toISOString(),
          },
        ])
      } else {
        await supabase
          .from('llamadas')
          .update({
            coordenadas: coords,
            hora: startedAt,
            descripcion: desc,
            lugar: place,
            equipo: team,
            updated_at: new Date().toISOString(),
          })
          .eq('numero', callNumber)
      }
    }
    return true
  } catch (e) {
    console.error('Error sincronizando llamadas ERLC en Supabase:', e)
    return false
  }
}

