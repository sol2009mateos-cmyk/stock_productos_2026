'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatearVencimiento, estaVencido } from '@/lib/utils'

export type Lote = {
  id: string
  producto_id: string
  vencimiento: string | null
  cantidad: number
}

export default function LotesModal({
  producto,
  lotes,
}: {
  producto: { id: string; nombre: string; stock: number }
  lotes: Lote[]
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [nuevoMes, setNuevoMes] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [ediciones, setEdiciones] = useState<Record<string, string>>({})

  function abrir() {
    setNuevoMes('')
    setNuevaCantidad('')
    setEdiciones({})
    setErrorMsg('')
    setAbierto(true)
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    const cantidad = parseInt(nuevaCantidad, 10)
    if (isNaN(cantidad) || cantidad <= 0) {
      setErrorMsg('La cantidad tiene que ser mayor a 0.')
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('agregar_lote', {
      p_producto_id: producto.id,
      p_vencimiento: nuevoMes ? `${nuevoMes}-01` : null,
      p_cantidad: cantidad,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setNuevoMes('')
    setNuevaCantidad('')
    router.refresh()
  }

  async function handleGuardarLote(lote: Lote) {
    setErrorMsg('')
    const texto = ediciones[lote.id]
    if (texto === undefined) return

    const cantidad = parseInt(texto, 10)
    if (isNaN(cantidad) || cantidad < 0) {
      setErrorMsg('La cantidad no puede ser negativa.')
      return
    }
    if (cantidad === 0 && !confirm(`¿Dar de baja todo el lote ${formatearVencimiento(lote.vencimiento)}? Se descuenta del stock.`)) {
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('ajustar_lote', {
      p_lote_id: lote.id,
      p_nueva_cantidad: cantidad,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const copia = { ...ediciones }
    delete copia[lote.id]
    setEdiciones(copia)
    router.refresh()
  }

  const ordenados = [...lotes].sort((a, b) => {
    if (a.vencimiento === b.vencimiento) return 0
    if (a.vencimiento === null) return 1
    if (b.vencimiento === null) return -1
    return a.vencimiento < b.vencimiento ? -1 : 1
  })

  return (
    <>
      <button
        onClick={abrir}
        className="text-emerald-400 hover:text-emerald-300 text-xs font-medium"
      >
        📅 Lotes
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-semibold text-lg">Lotes de {producto.nombre}</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Stock total: {producto.stock}</p>

            {ordenados.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Este producto no tiene lotes cargados.</p>
            ) : (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="pb-2">Vencimiento</th>
                    <th className="pb-2 text-right">Cantidad</th>
                    <th className="pb-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenados.map((l) => {
                    const vencido = estaVencido(l.vencimiento)
                    const valor = ediciones[l.id] ?? String(l.cantidad)
                    return (
                      <tr key={l.id} className="border-b border-gray-800">
                        <td className="py-2">
                          <span className={vencido ? 'text-red-400 font-medium' : 'text-gray-200'}>
                            {formatearVencimiento(l.vencimiento)}
                          </span>
                          {vencido && <span className="text-red-400 text-xs ml-2">vencido</span>}
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={valor}
                            onChange={(e) => setEdiciones({ ...ediciones, [l.id]: e.target.value })}
                            className="w-24 bg-[#0f1117] border border-gray-700 rounded-lg px-2 py-1 text-white text-sm text-right"
                          />
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleGuardarLote(l)}
                            disabled={guardando || ediciones[l.id] === undefined || ediciones[l.id] === String(l.cantidad)}
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-30 text-xs font-medium"
                          >
                            Guardar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            <form onSubmit={handleAgregar} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
              <p className="text-gray-300 text-sm font-medium mb-2">Agregar stock a un lote</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Vencimiento (mes y año)</label>
                  <input
                    type="month"
                    value={nuevoMes}
                    onChange={(e) => setNuevoMes(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={nuevaCantidad}
                    onChange={(e) => setNuevaCantidad(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Si lo dejás sin fecha, entra al lote &quot;Sin vencimiento&quot;. Si ya existe un lote con ese mes y año, se suma.
              </p>
              <button
                type="submit"
                disabled={guardando}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
              >
                {guardando ? 'Guardando...' : 'Agregar al lote'}
              </button>
            </form>

            {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
