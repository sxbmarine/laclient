import { syncEmergencyCallsFromERLC } from './mdtService'

/**
 * Invoca la API v2 oficial de ERLC utilizando la cabecera 'server-key'
 */
export async function fetchERLCServerV2(serverKey: string) {
  if (!serverKey) return null
  try {
    const res = await fetch('https://api.erlc.gg/v2/server?EmergencyCalls=true', {
      method: 'GET',
      headers: {
        'server-key': serverKey,
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      const errText = await res.text()
      console.error('Error invocando API ERLC v2 Status:', res.status, errText)
      return null
    }
    const data = await res.json()
    console.log('[ERLC API v2 Respuesta Completa]:', data)
    return data
  } catch (err) {
    console.error('Error en fetchERLCServerV2:', err)
    return null
  }
}

/**
 * Servicio cliente de sincronización automática de llamadas ERLC en caso de pruebas locales o fallback.
 */
export async function syncERLCCallsClientFallback(emergencyCalls: any[]) {
  return await syncEmergencyCallsFromERLC(emergencyCalls)
}
