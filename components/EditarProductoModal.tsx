'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  stock: number
  codigo_barras: string | null
}

export default function EditarProductoModal({ producto }: { producto: Producto }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [nombre, setNombre] = useState(producto.nombre)
  const [categoria, setCategoria] = useState(producto.categoria ?? '')
  const [precio, setPrecio] = useState(String(producto.precio))
  const [stock, setStock] = useState(String(producto.stock))
  const [codigoBarras, setCodigoBarras] = useState(producto.codigo_barras ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    const precioNum = parseFloat(precio)
    const stockNum = parseInt(stock, 10)

    if (precioNum < 0) {
      setErrorMsg('El precio no puede ser negativo.')
      return
    }
    if (stockNum < 0) {
      setErrorMsg('El stock no puede ser negativo.')
      return
    }

    setGuardando(true)

    const { error } = await supabase
      .from('productos')
      .update({
        nombre,
        categoria,
        precio: precioNum,
        stock: stockNum,
        codigo_barras: codigoBarras || null,
      })
      .eq('id', producto.id)

    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  async function handleEliminar() {
    if (!confirm(`¿Seguro que querés eliminar "${producto.nombre}"?`)) return

    setGuardando(true)
    const { error } = await supabase.from('productos').delete().eq('id', producto.id)
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
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Editar producto</h2>
              <button
                onClick={() => setAbierto(false)}
                className="text-gray-500 hover:text-gray-300"
              >
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

              <div>
                <label className="text-xs text-gray-400">Categoría</label>
                <input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Precio</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Stock</label>
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Código de barras (opcional)</label>
                <input
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
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
