'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Asistencia = {
  id: string
  fecha: string
  hora_entrada: string | null
  hora_salida: string | null
}

function horaActual() {
  const ahora = new Date()
  return ahora.toTimeString().slice(0, 8)
}

function fechaHoy() {
  return new Date().toISOString().slice(0, 10)
}

export default function AsistenciasEmpleado({
  empleadoId,
  asistencias,
}: {
  empleadoId: string
  asistencias: Asistencia[]
}) {
  const router = useRouter()
  const [procesando, setProcesando] = useState(false)

  const asistenciaHoy = asistencias.find((a) => a.fecha === fechaHoy())
  const puedeMarcarEntrada = !asistenciaHoy
  const puedeMarcarSalida = asistenciaHoy && !asistenciaHoy.hora_salida

  async function marcarEntrada() {
    setProcesando(true)
    await supabase.from('asistencias').insert({
      empleado_id: empleadoId,
      fecha: fechaHoy(),
      hora_entrada: horaActual(),
    })
    setProcesando(false)
    router.refresh()
  }

  async function marcarSalida() {
    if (!asistenciaHoy) return
    setProcesando(true)
    await supabase
      .from('asistencias')
      .update({ hora_salida: horaActual() })
      .eq('id', asistenciaHoy.id)
    setProcesando(false)
    router.refresh()
  }

  return (
    <div className="bg-[#161922] rounded-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-semibold">🕐 Asistencias</h2>
        <div className="flex gap-2">
          {puedeMarcarEntrada && (
            <button
              onClick={marcarEntrada}
              disabled={procesando}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Marcar entrada
            </button>
          )}
          {puedeMarcarSalida && (
            <button
              onClick={marcarSalida}
              disabled={procesando}
              className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Marcar salida
            </button>
          )}
          {asistenciaHoy?.hora_salida && (
            <span className="text-gray-500 text-sm px-4 py-2">Jornada de hoy completa ✅</span>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            <th className="pb-2">Fecha</th>
            <th className="pb-2">Entrada</th>
            <th className="pb-2">Salida</th>
          </tr>
        </thead>
        <tbody>
          {asistencias.slice(0, 15).map((a) => (
            <tr key={a.id} className="border-b border-gray-800">
              <td className="py-2 text-gray-300">
                {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
              </td>
              <td className="py-2 text-gray-300">{a.hora_entrada?.slice(0, 5) ?? '—'}</td>
              <td className="py-2 text-gray-300">{a.hora_salida?.slice(0, 5) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {asistencias.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">Todavía no hay asistencias registradas.</p>
      )}
    </div>
  )
}
