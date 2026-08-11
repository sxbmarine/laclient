import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ERLC_API = "https://api.policeroleplay.community/v2/server";

interface ErlcPlayerRaw {
  Player: string;
  Team: string;
  Location: string;
  Callsign?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const serverKey = Deno.env.get("ERLC_SERVER_KEY");
  if (!serverKey) {
    return new Response(
      JSON.stringify({ error: "Server key no configurada" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await fetch(`${ERLC_API}?Players=true`, {
      headers: { "server-key": serverKey },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Error consultando API de ERLC" }),
        { status: response.status, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const rawPlayers: ErlcPlayerRaw[] = data.Players ?? [];

    const players = rawPlayers.map((p) => ({
      player: p.Player,
      team: p.Team,
      location: p.Location,
      callsign: p.Callsign ?? null,
    }));

    return new Response(JSON.stringify({ players }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Error interno del proxy" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
