import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { StatusBar } from '@/components/StatusBar'
import { supabase, getDiscordId, generatePhoneNumber, generateIdNumber, formatPhoneNumber } from '@/lib/supabase'
import styles from './OnboardingScreen.module.css'

export function OnboardingScreen() {
  const navigate = useNavigate()
  const { user, personaje, refreshPersonaje } = useAuth()

  const [assignedNumero] = useState(() => generatePhoneNumber())
  const [assignedIdNumber] = useState(() => generateIdNumber())
  const [roblox, setRoblox] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [genero, setGenero] = useState('Masculino')
  const [domicilio, setDomicilio] = useState('')
  const [nacionalidad, setNacionalidad] = useState('Estadounidense')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roblox.trim()) {
      setError('El usuario de Roblox es obligatorio')
      return
    }
    if (!nombre.trim()) {
      setError('El nombre del personaje es obligatorio')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const discordId =
        personaje?.discord_id ||
        (await getDiscordId()) ||
        user?.user_metadata?.provider_id ||
        user?.id

      if (!discordId) {
        throw new Error('No se pudo obtener la identidad de Discord')
      }

      // 1. Insert into personajes using assignedNumero (e.g., 2130123456) and assignedIdNumber (e.g. A1234567)
      const insertPayload: Record<string, any> = {
        discord_id: discordId,
        user_id: user?.id || null,
        nombre: nombre.trim(),
        numero: assignedNumero,
        idnumber: assignedIdNumber,
        fecha_nacimiento: fechaNacimiento || null,
        genero: genero || null,
        domicilio: domicilio.trim() || null,
        nacionalidad: nacionalidad.trim() || null,
        usuario_roblox: roblox.trim(),
      }

      const { error: pErr } = await supabase.from('personajes').insert(insertPayload)

      if (pErr) {
        console.error('Error insert personajes:', pErr)
        if (pErr.code === '42501' || pErr.message?.toLowerCase().includes('row-level security')) {
          throw new Error('Error RLS: La tabla "personajes" en Supabase tiene Row Level Security activo. Ejecuta la política SQL de INSERT o deshabilita RLS en esa tabla.')
        }
        throw new Error(pErr.message || 'Error al guardar el personaje')
      }

      // 2. Try updating usuarios table 'roblox' field
      if (user?.id) {
        const { error: uErr } = await supabase
          .from('usuarios')
          .update({ roblox: roblox.trim() })
          .eq('id', user.id)

        if (uErr) {
          console.warn('Aviso al actualizar tabla usuarios:', uErr.message)
        }
      }

      // 3. Refresh AuthContext state & navigate
      await refreshPersonaje()
      navigate('/', { replace: true })
    } catch (err: any) {
      console.error('Error al crear personaje:', err)
      const msg = err?.message || (typeof err === 'string' ? err : 'Error al crear el personaje')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.onboarding}>
      <StatusBar light />
      <div className={`${styles.content} app-scroll`}>
        <div className={`${styles.header} fade-in`}>
          <img src="/src/assets/logo_shadow.png" alt="Logo" width={100} height={100} />
          <h1 className={styles.title}>Bienvenido! Ayudanos a conocerte</h1>
          <p className={styles.subtitle}>
            Completa los datos para emitir tu documentación
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={`${styles.form} fade-in`}>
          <div className={styles.fieldGroup}>
            <label className="ios-label">Usuario de Roblox</label>
            <input
              className="ios-input"
              type="text"
              value={roblox}
              onChange={(e) => setRoblox(e.target.value)}
              placeholder="Ej: RobloxPlayer123"
              disabled={submitting}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className="ios-label">Nombre del personaje</label>
            <input
              className="ios-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Michael De Santa"
              disabled={submitting}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className="ios-label">ID Number</label>
              <input
                className="ios-input"
                type="text"
                value={assignedIdNumber}
                disabled
                readOnly
                style={{ opacity: 0.85, cursor: 'not-allowed' }}
              />
            </div>

            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className="ios-label">Teléfono</label>
              <input
                className="ios-input"
                type="text"
                value={formatPhoneNumber(assignedNumero)}
                disabled
                readOnly
                style={{ opacity: 0.85, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className="ios-label">Género</label>
            <select
              className="ios-input"
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              disabled={submitting}
              style={{ height: 45 }}
            >
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className="ios-label">Fecha de nacimiento</label>
            <input
              className="ios-input"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className="ios-label">Domicilio</label>
            <input
              className="ios-input"
              type="text"
              value={domicilio}
              onChange={(e) => setDomicilio(e.target.value)}
              placeholder="Ej: Rockford Hills 104"
              disabled={submitting}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className="ios-label">Nacionalidad</label>
            <input
              className="ios-input"
              type="text"
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              placeholder="Ej: Estadounidense"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="ios-btn ios-btn-primary"
            style={{ marginTop: 24 }}
            disabled={submitting}
          >
            {submitting ? 'Creando personaje...' : 'Crear y emitir DNIe'}
          </button>
        </form>
      </div>
    </div>
  )
}
