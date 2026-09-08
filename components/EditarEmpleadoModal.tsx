'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Empleado = {
  id: string
  nombre: string
  apellido: string
  cargo: string | null
  area: string | null
  email: string | null
  telefono: string | null
  fecha_alta: string
  fecha_baja: string | null
  notas: string | null
}

export default function EditarEmpleadoModal({ empleado }: { empleado: Empleado }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [nombre, setNombre] = useState(empleado.nombre)
  const [apellido, setApellido] = useState(empleado.apellido)
  const [cargo, setCargo] = useState(empleado.cargo ?? '')
  const [area, setArea] = useState(empleado.area ?? '')
  const [email, setEmail] = useState(empleado.email ?? '')
  const [telefono, setTelefono] = useState(empleado.telefono ?? '')
  const [fechaAlta, setFechaAlta] = useState(empleado.fecha_alta)
  const [fechaBaja, setFechaBaja] = useState(empleado.fecha_baja ?? '')
  const [notas, setNotas] = useState(empleado.notas ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg('')

    const { error } = await supabase
      .from('empleados')
      .update({
        nombre,
        apellido,
        cargo: cargo || null,
        area: area || null,
        email: email || null,
        telefono: telefono || null,
        fecha_alta: fechaAlta,
        fecha_baja: fechaBaja || null,
        notas: notas || null,
      })
      .eq('id', empleado.id)

    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  async function handleEliminar() {
    if (!confirm(`¿Seguro que querés eliminar a ${empleado.nombre} ${empleado.apellido}? Esta acción no se puede deshacer.`)) return

    setGuardando(true)
    const { error } = await supabase.from('empleados').delete().eq('id', empleado.id)
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
      >
        ✏️ Editar
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Editar empleado</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Nombre</label>
                  <input
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Apellido</label>
                  <input
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Cargo</label>
                <input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Área</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Fecha de alta</label>
                  <input
                    required
                    type="date"
                    value={fechaAlta}
                    onChange={(e) => setFechaAlta(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Fecha de baja</label>
                  <input
                    type="date"
                    value={fechaBaja}
                    onChange={(e) => setFechaBaja(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Dejá "Fecha de baja" vacía si el empleado sigue activo.
              </p>

              <div>
                <label className="text-xs text-gray-400">Notas</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
                >
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={guardando}
                  className="px-4 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 font-medium py-2 rounded-lg"
                >
                  🗑️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
