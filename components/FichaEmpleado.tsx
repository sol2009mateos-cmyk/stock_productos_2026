'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import EditarEmpleadoModal from '@/components/EditarEmpleadoModal'

type Empleado = {
  id: string
  nombre: string
  apellido: string
  cargo: string | null
  area: string | null
  foto_url: string | null
  email: string | null
  telefono: string | null
  fecha_alta: string
  fecha_baja: string | null
  notas: string | null
}

type Responsabilidad = {
  id: string
  categoria: string
}

export default function FichaEmpleado({
  empleado,
  responsabilidades,
  todasLasCategorias,
}: {
  empleado: Empleado
  responsabilidades: Responsabilidad[]
  todasLasCategorias: string[]
}) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const activo = !empleado.fecha_baja

  const categoriasAsignadas = responsabilidades.map((r) => r.categoria)
  const categoriasDisponibles = todasLasCategorias.filter((c) => !categoriasAsignadas.includes(c))

  async function asignarCategoria(categoria: string) {
    setGuardando(true)
    await supabase.from('producto_responsables').insert({
      empleado_id: empleado.id,
      categoria,
    })
    setGuardando(false)
    router.refresh()
  }

  async function quitarCategoria(id: string) {
    setGuardando(true)
    await supabase.from('producto_responsables').delete().eq('id', id)
    setGuardando(false)
    router.refresh()
  }

  return (
    <div>
      <Link href="/empleados" className="text-blue-400 hover:text-blue-300 text-sm">
        ← Volver a Empleados
      </Link>

      <div className="bg-[#161922] rounded-lg p-6 mt-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-2xl font-bold text-white">
              {empleado.nombre[0]}
              {empleado.apellido[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {empleado.nombre} {empleado.apellido}
              </h1>
              <p className="text-gray-400 text-sm">{empleado.cargo} — {empleado.area}</p>
              <span
                className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                  activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}
              >
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <EditarEmpleadoModal empleado={empleado} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Email</p>
            <p className="text-gray-200">{empleado.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Teléfono</p>
            <p className="text-gray-200">{empleado.telefono || '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Fecha de alta</p>
            <p className="text-gray-200">{new Date(empleado.fecha_alta).toLocaleDateString('es-AR')}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Fecha de baja</p>
            <p className="text-gray-200">
              {empleado.fecha_baja ? new Date(empleado.fecha_baja).toLocaleDateString('es-AR') : '—'}
            </p>
          </div>
        </div>

        {empleado.notas && (
          <div className="mt-4">
            <p className="text-gray-500 text-xs">Notas</p>
            <p className="text-gray-300 text-sm mt-1">{empleado.notas}</p>
          </div>
        )}
      </div>

      <div className="bg-[#161922] rounded-lg p-6">
        <h2 className="text-white font-semibold mb-4">📦 Categorías a cargo</h2>

        {categoriasAsignadas.length === 0 ? (
          <p className="text-gray-500 text-sm mb-4">Sin categorías asignadas todavía.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {responsabilidades.map((r) => (
              <span
                key={r.id}
                className="bg-blue-900 text-blue-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2"
              >
                {r.categoria}
                <button
                  onClick={() => quitarCategoria(r.id)}
                  disabled={guardando}
                  className="text-blue-300 hover:text-white"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {categoriasDisponibles.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-2">Asignar categoría:</p>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponibles.map((c) => (
                <button
                  key={c}
                  onClick={() => asignarCategoria(c)}
                  disabled={guardando}
                  className="text-xs bg-[#0f1117] hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
