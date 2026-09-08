'use client'

import { useState } from 'react'
import Link from 'next/link'
import EditarEmpleadoModal from '@/components/EditarEmpleadoModal'

type Empleado = {
  id: string
  nombre: string
  apellido: string
  cargo: string | null
  area: string | null
  foto_url: string | null
  fecha_alta: string
  fecha_baja: string | null
}

export default function EmpleadosTabla({ empleados }: { empleados: Empleado[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [areaActiva, setAreaActiva] = useState('Todas')
  const [estadoActivo, setEstadoActivo] = useState<'todos' | 'activo' | 'inactivo'>('todos')

  const areas = ['Todas', ...Array.from(new Set(empleados.map((e) => e.area).filter(Boolean) as string[])).sort()]

  const filtrados = empleados.filter((e) => {
    const nombreCompleto = `${e.nombre} ${e.apellido}`.toLowerCase()
    const coincideBusqueda = nombreCompleto.includes(busqueda.toLowerCase())
    const coincideArea = areaActiva === 'Todas' || e.area === areaActiva
    const esActivo = !e.fecha_baja
    const coincideEstado =
      estadoActivo === 'todos' || (estadoActivo === 'activo' ? esActivo : !esActivo)
    return coincideBusqueda && coincideArea && coincideEstado
  })

  return (
    <div>
      <input
        type="text"
        placeholder="🔍 Buscar empleado por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-[#161922] border border-gray-700 rounded-lg px-4 py-3 mb-4 text-white text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="flex flex-wrap gap-2 mb-3">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setAreaActiva(a)}
            className={`text-sm font-medium px-4 py-2 rounded-lg ${
              areaActiva === a ? 'bg-blue-600 text-white' : 'bg-[#161922] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {(['todos', 'activo', 'inactivo'] as const).map((e) => (
          <button
            key={e}
            onClick={() => setEstadoActivo(e)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize ${
              estadoActivo === e ? 'bg-purple-700 text-white' : 'bg-[#161922] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {e === 'todos' ? 'Todos' : e === 'activo' ? '🟢 Activos' : '🔴 Inactivos'}
          </button>
        ))}
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Cargo</th>
              <th className="pb-2">Área</th>
              <th className="pb-2">Estado</th>
              <th className="pb-2">Fecha de alta</th>
              <th className="pb-2 text-right">Ver</th>
              <th className="pb-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => {
              const activo = !e.fecha_baja
              return (
                <tr key={e.id} className="border-b border-gray-800">
                  <td className="py-3 text-gray-200 font-medium">{e.nombre} {e.apellido}</td>
                  <td className="py-3 text-gray-400">{e.cargo}</td>
                  <td className="py-3 text-gray-400">{e.area}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(e.fecha_alta).toLocaleDateString('es-AR')}
                  </td>
                                    <td className="py-3 text-right">
                    <Link href={`/empleados/${e.id}`} className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                      Ver ficha →
                    </Link>
                  </td>
                  <td className="py-3 text-right">
                    <EditarEmpleadoModal empleado={e} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No hay empleados que coincidan con el filtro.</p>
        )}
      </div>
    </div>
  )
}
