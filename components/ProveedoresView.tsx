'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Proveedor = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  notas: string | null
}

export default function ProveedoresView({
  proveedores,
  puedeEliminar,
}: {
  proveedores: Proveedor[]
  puedeEliminar: boolean
}) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [notas, setNotas] = useState('')

  function abrirNuevo() {
    setEditando(null)
    setNombre('')
    setTelefono('')
    setEmail('')
    setNotas('')
    setErrorMsg('')
    setAbierto(true)
  }

  function abrirEditar(p: Proveedor) {
    setEditando(p)
    setNombre(p.nombre)
    setTelefono(p.telefono ?? '')
    setEmail(p.email ?? '')
    setNotas(p.notas ?? '')
    setErrorMsg('')
    setAbierto(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setGuardando(true)

    const supabase = createClient()
    const datos = {
      nombre: nombre.trim(),
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      notas: notas.trim() || null,
    }

    const { error } = editando
      ? await supabase.from('proveedores').update(datos).eq('id', editando.id)
      : await supabase.from('proveedores').insert(datos)

    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  async function handleEliminar() {
    if (!editando) return
    if (!confirm(`¿Seguro que querés eliminar a "${editando.nombre}"?`)) return

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('proveedores').delete().eq('id', editando.id)
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  const filtrados = proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">🚚 Proveedores</h1>
          <p className="text-gray-500 text-sm mt-1">{proveedores.length} proveedores</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Agregar proveedor
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Buscar proveedor por nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-[#161922] border border-gray-700 rounded-lg px-4 py-3 mb-4 text-white text-sm focus:outline-none focus:border-blue-500"
      />

      <div className="bg-[#161922] rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Teléfono</th>
              <th className="pb-2">Email</th>
              <th className="pb-2">Notas</th>
              <th className="pb-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className="border-b border-gray-800">
                <td className="py-3 text-gray-200 font-medium">{p.nombre}</td>
                <td className="py-3 text-gray-400">{p.telefono ?? '—'}</td>
                <td className="py-3 text-gray-400">{p.email ?? '—'}</td>
                <td className="py-3 text-gray-500">{p.notas ?? ''}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            {proveedores.length === 0 ? 'Todavía no cargaste proveedores.' : 'No se encontraron proveedores.'}
          </p>
        )}
      </div>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">
                {editando ? 'Editar proveedor' : 'Agregar proveedor'}
              </h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-400">Nombre</label>
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Teléfono (opcional)</label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
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
              </div>
              <div>
                <label className="text-xs text-gray-400">Notas (opcional)</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
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
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar proveedor'}
                </button>
                {editando && puedeEliminar && (
                  <button
                    type="button"
                    onClick={handleEliminar}
                    disabled={guardando}
                    className="px-4 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 font-medium py-2 rounded-lg"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
