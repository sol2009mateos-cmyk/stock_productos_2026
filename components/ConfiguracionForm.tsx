'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Config = {
  id: number
  nombre_negocio: string
  cuit: string | null
  direccion: string | null
  porcentaje_iva: number
  siguiente_numero_recibo: number
}

export default function ConfiguracionForm({ config }: { config: Config | null }) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [guardadoOk, setGuardadoOk] = useState(false)

  const [nombreNegocio, setNombreNegocio] = useState(config?.nombre_negocio ?? '')
  const [cuit, setCuit] = useState(config?.cuit ?? '')
  const [direccion, setDireccion] = useState(config?.direccion ?? '')
  const [porcentajeIva, setPorcentajeIva] = useState(String(config?.porcentaje_iva ?? 21))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg('')
    setGuardadoOk(false)

    const { error } = await supabase
      .from('config')
      .update({
        nombre_negocio: nombreNegocio,
        cuit: cuit || null,
        direccion: direccion || null,
        porcentaje_iva: parseFloat(porcentajeIva),
      })
      .eq('id', 1)

    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setGuardadoOk(true)
    router.refresh()
  }

  if (!config) {
    return (
      <div className="text-red-400">
        No se pudo cargar la configuración. Verificá que la tabla `config` tenga una fila con id = 1.
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">⚙️ Configuración</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-[#161922] rounded-lg p-6 max-w-lg flex flex-col gap-4"
      >
        <div>
          <label className="text-xs text-gray-400">Nombre del negocio</label>
          <input
            required
            value={nombreNegocio}
            onChange={(e) => setNombreNegocio(e.target.value)}
            className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">CUIT</label>
          <input
            value={cuit}
            onChange={(e) => setCuit(e.target.value)}
            placeholder="20-12345678-9"
            className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">Dirección</label>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">Porcentaje de IVA (%)</label>
          <input
            required
            type="number"
            step="0.01"
            value={porcentajeIva}
            onChange={(e) => setPorcentajeIva(e.target.value)}
            className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>

        <div className="text-xs text-gray-500">
          Próximo número de recibo: <span className="text-gray-300">{config.siguiente_numero_recibo}</span>
        </div>

        {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}
        {guardadoOk && <p className="text-green-400 text-sm">✅ Configuración guardada.</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
