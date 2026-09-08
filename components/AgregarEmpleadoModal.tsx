'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AgregarEmpleadoModal() {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [cargo, setCargo] = useState('')
  const [area, setArea] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().slice(0, 10))

  function limpiar() {
    setNombre('')
    setApellido('')
    setCargo('')
    setArea('')
    setEmail('')
    setTelefono('')
    setFechaAlta(new Date().toISOString().slice(0, 10))
    setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg('')

    const { error } = await supabase.from('empleados').insert({
      nombre,
      apellido,
      cargo: cargo || null,
      area: area || null,
      email: email || null,
      telefono: telefono || null,
      fecha_alta: fechaAlta,
    })

    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    limpiar()
    setAbierto(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        + Agregar empleado
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Agregar empleado</h2>
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
                  placeholder="Ej: Cajero, Repositor, Encargado"
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Área</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ej: Ventas, Depósito, Administración"
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Email (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Teléfono (opcional)</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

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

              {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={guardando}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg mt-2"
              >
                {guardando ? 'Guardando...' : 'Guardar empleado'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
