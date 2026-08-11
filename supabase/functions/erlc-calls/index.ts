import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: any;

const ERLC_API = "https://api.erlc.gg/v2/server";

export interface EmergencyCallRaw {
  Team: string;
  Caller: number;
  Players?: number[];
  Position?: [number, number];
  StartedAt: number;
  CallNumber: number;
  Description: string;
  PositionDescriptor?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Manejo de peticiones preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificación de autenticación de Supabase
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Obtener la clave del servidor de los secretos de Supabase
  const serverKey = Deno.env.get("ERLC_SERVER_KEY");
  if (!serverKey) {
    return new Response(
      JSON.stringify({ error: "Server key (ERLC_SERVER_KEY) no configurada en Supabase Secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Consulta a la API de ERLC activando el parámetro EmergencyCalls=true
    const url = `${ERLC_API}?EmergencyCalls=true&Players=true`;
    const response = await fetch(url, {
      headers: { "Server-Key": serverKey },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Error consultando API de ERLC (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const rawCalls: EmergencyCallRaw[] = data.EmergencyCalls ?? [];

    // Formatear y mapear los datos de las llamadas de emergencia
    const calls = rawCalls.map((c) => ({
      callNumber: c.CallNumber,
      team: c.Team,
      caller: c.Caller,
      respondingPlayers: c.Players ?? [],
      positionX: c.Position?.[0] ?? 0,
      positionZ: c.Position?.[1] ?? 0,
      startedAt: c.StartedAt,
      description: c.Description,
      positionDescriptor: c.PositionDescriptor ?? "Ubicación no especificada",
    }));

    return new Response(
      JSON.stringify({
        serverName: data.Name,
        currentPlayers: data.CurrentPlayers,
        totalCalls: calls.length,
        calls,
        rawEmergencyCalls: rawCalls,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Error interno procesando las llamadas de emergencia", details: err?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
