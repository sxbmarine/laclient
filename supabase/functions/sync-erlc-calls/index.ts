// ============================================================
// SUPABASE EDGE FUNCTION: sync-erlc-calls
// Sincronización continua de llamadas de emergencia desde ERLC API
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''
    const erlcServerKey = Deno.env.get('ERLC_SERVER_KEY') || Deno.env.get('ERLC_API_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch ERLC API EmergencyCalls v2
    let emergencyCalls: any[] = []
    let rawApiResponse: any = null
    let responseStatus = 0

    if (erlcServerKey) {
      const res = await fetch('https://api.erlc.gg/v2/server?EmergencyCalls=true', {
        method: 'GET',
        headers: {
          'server-key': erlcServerKey,
          'Accept': 'application/json'
        }
      })

      responseStatus = res.status
      if (res.ok) {
        rawApiResponse = await res.json()
        console.log('[sync-erlc-calls] ERLC API Response Status 200 OK:', JSON.stringify(rawApiResponse))
        
        emergencyCalls = rawApiResponse.EmergencyCalls || rawApiResponse.Emergencycall || rawApiResponse.Calls || rawApiResponse.calls || []
        console.log(`[sync-erlc-calls] Emergency Calls Encontradas: ${emergencyCalls.length}`)
      } else {
        const errText = await res.text()
        console.error('[sync-erlc-calls] Error respondiendo API ERLC Status:', res.status, errText)
        rawApiResponse = { errorText: errText, status: res.status }
      }
    } else {
      console.warn('[sync-erlc-calls] No se encontro ERLC_SERVER_KEY o ERLC_API_KEY en las variables de entorno.')
    }

    if (Array.isArray(emergencyCalls) && emergencyCalls.length > 0) {
      for (const call of emergencyCalls) {
        const callNumber = Number(call.CallNumber || call.numero || call.CallId || call.id)
        if (!callNumber) continue

        const startedAt = call.StartedAt
          ? new Date(Number(call.StartedAt) * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

        const coords = Array.isArray(call.Position) ? call.Position : [0, 0]
        const team = call.Team || 'Police'
        const desc = call.Description || 'Llamada de Emergencia'
        const place = call.PositionDescriptor || 'Ubicación no especificada'

        const { data: existing } = await supabase
          .from('llamadas')
          .select('numero')
          .eq('numero', callNumber)
          .maybeSingle()

        if (!existing) {
          await supabase.from('llamadas').insert([{
            numero: callNumber,
            coordenadas: coords,
            estado: false,
            hora: startedAt,
            descripcion: desc,
            lugar: place,
            notas: '',
            unidades: [],
            equipo: team,
            updated_at: new Date().toISOString()
          }])
        } else {
          await supabase.from('llamadas').update({
            coordenadas: coords,
            hora: startedAt,
            descripcion: desc,
            lugar: place,
            equipo: team,
            updated_at: new Date().toISOString()
          }).eq('numero', callNumber)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: responseStatus,
        count: emergencyCalls.length,
        emergencyCallsFound: emergencyCalls,
        rawApiResponse: rawApiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err: any) {
    console.error('[sync-erlc-calls] Excepcion:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
