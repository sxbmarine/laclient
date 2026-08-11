# ERLC Overlay — Teléfono móvil de escritorio

App de escritorio (Electron + React + Vite) que simula un teléfono móvil para jugadores de un servidor ERLC. Se conecta a la misma base de datos Supabase que el bot de Discord existente.

## Requisitos

- Node.js 20+
- Proyecto Supabase configurado con el esquema existente
- Discord OAuth habilitado en Supabase Auth

## Configuración

1. Copia `.env.example` a `.env` y rellena las variables:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

2. En **Supabase Dashboard → Authentication → URL Configuration**, añade:
   - Site URL: `erlcapp://auth/callback`
   - Redirect URLs: `erlcapp://auth/callback`

3. Despliega la Edge Function del proxy ERLC:

```bash
supabase secrets set ERLC_SERVER_KEY=tu-server-key
supabase functions deploy erlc-server
```

## Desarrollo

```bash
npm install
npm run dev
```

Esto arranca Vite + Electron en modo desarrollo.

## Build

```bash
npm run build
```

Genera el instalador en `release/`.

## Apps incluidas

| App | Descripción |
|-----|-------------|
| Login | Discord OAuth vía deep link (`erlcapp://`) |
| Banco | Cuentas, transferencias RPC, historial |
| DNIe | Datos del personaje activo |
| Mapa | Posiciones en vivo vía proxy ERLC |
| Contactos | Agenda personal |
| Mensajes | Chat en tiempo real (Supabase Realtime) |
| GPS | Compartir ubicación opt-in con contactos |

## Arquitectura

```
electron/main.ts     → OAuth deep link, IPC, protocolo erlcapp://
electron/preload.ts  → contextBridge seguro
src/                 → React renderer (UI estilo iPhone)
supabase/functions/  → Edge Function proxy para API ERLC
```

## Seguridad

- Nunca se expone `service_role` ni `server-key` en el cliente
- Transferencias bancarias vía RPC `transferir()` (atómica)
- RLS activo en todas las tablas; acceso con cliente `authenticated`
- OAuth en navegador del sistema, nunca en BrowserWindow embebido
