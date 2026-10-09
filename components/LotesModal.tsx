'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatearMoneda, formatearVencimiento, estaVencido } from '@/lib/utils'

export type Lote = {
  id: string
  producto_id: string
  vencimiento: string | null
  cantidad: number
  numero_lote: string | null
  proveedor_id: string | null
  costo: number | null
}

export type ProveedorLote = { id: string; nombre: string }

export default function LotesModal({
  producto,
  lotes,
  proveedores,
}: {
  producto: { id: string; nombre: string; stock: number }
  lotes: Lote[]
  proveedores: ProveedorLote[]
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [ediciones, setEdiciones] = useState<Record<string, string>>({})

  // Asignar vencimiento a stock que ya estaba "sin vencimiento"
  const [asignandoId, setAsignandoId] = useState<string | null>(null)
  const [asigMes, setAsigMes] = useState('')
  const [asigCant, setAsigCant] = useState('')
  const [asigNum, setAsigNum] = useState('')

  // Ingreso de mercadería nueva
  const [nuevoMes, setNuevoMes] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nuevoProveedor, setNuevoProveedor] = useState('')
  const [nuevoCosto, setNuevoCosto] = useState('')

  function nombreProveedor(id: string | null) {
    if (!id) return null
    return proveedores.find((p) => p.id === id)?.nombre ?? null
  }

  function abrir() {
    setEdiciones({})
    setAsignandoId(null)
    setAsigMes('')
    setAsigCant('')
    setAsigNum('')
    setNuevoMes('')
    setNuevaCantidad('')
    setNuevoNumero('')
    setNuevoProveedor('')
    setNuevoCosto('')
    setErrorMsg('')
    setAbierto(true)
  }

  function empezarAsignar(l: Lote) {
    setAsignandoId(l.id)
    setAsigMes('')
    setAsigCant(String(l.cantidad))
    setAsigNum('')
    setErrorMsg('')
  }

  async function handleAsignar(e: React.FormEvent, l: Lote) {
    e.preventDefault()
    setErrorMsg('')

    const cantidad = parseInt(asigCant, 10)
    if (!asigMes) {
      setErrorMsg('Elegí el mes y año de vencimiento.')
      return
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      setErrorMsg('La cantidad tiene que ser mayor a 0.')
      return
    }
    if (cantidad > l.cantidad) {
      setErrorMsg(`Solo hay ${l.cantidad} unidades sin vencimiento en ese lote.`)
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('asignar_vencimiento', {
      p_lote_origen_id: l.id,
      p_cantidad: cantidad,
      p_vencimiento: `${asigMes}-01`,
      p_numero_lote: asigNum.trim() || null,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAsignandoId(null)
    router.refresh()
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    const cantidad = parseInt(nuevaCantidad, 10)
    if (isNaN(cantidad) || cantidad <= 0) {
      setErrorMsg('La cantidad tiene que ser mayor a 0.')
      return
    }

    const costo = nuevoCosto.trim() === '' ? null : parseFloat(nuevoCosto)
    if (costo !== null && (isNaN(costo) || costo < 0)) {
      setErrorMsg('El costo no puede ser negativo.')
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('agregar_lote', {
      p_producto_id: producto.id,
      p_vencimiento: nuevoMes ? `${nuevoMes}-01` : null,
      p_cantidad: cantidad,
      p_numero_lote: nuevoNumero.trim() || null,
      p_proveedor_id: nuevoProveedor || null,
      p_costo: costo,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setNuevoMes('')
    setNuevaCantidad('')
    setNuevoNumero('')
    setNuevoProveedor('')
    setNuevoCosto('')
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
    if (cantidad === 0 && !confirm(`¿Dar de baja todo este lote? Se descuenta del stock.`)) {
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

  const sinVencimiento = lotes.filter((l) => l.vencimiento === null).reduce((acc, l) => acc + l.cantidad, 0)

  return (
    <>
      <button onClick={abrir} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">
        📅 Lotes
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-semibold text-lg">Lotes de {producto.nombre}</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-1">Stock total: {producto.stock}</p>
            {sinVencimiento > 0 && (
              <p className="text-amber-400 text-xs mb-3">
                Hay {sinVencimiento} u. sin vencimiento. Usá &quot;Asignar vencimiento&quot; para ponerles fecha sin sumar stock.
              </p>
            )}

            {ordenados.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Este producto no tiene lotes cargados.</p>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {ordenados.map((l) => {
                  const vencido = estaVencido(l.vencimiento)
                  const valor = ediciones[l.id] ?? String(l.cantidad)
                  const prov = nombreProveedor(l.proveedor_id)
                  return (
                    <div key={l.id} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <p className={`text-sm font-medium ${vencido ? 'text-red-400' : 'text-gray-200'}`}>
                            {formatearVencimiento(l.vencimiento)}
                            {vencido && <span className="text-xs ml-2">vencido</span>}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {l.numero_lote ? `Lote ${l.numero_lote}` : 'Sin nº de lote'}
                            {' · '}
                            {prov ?? 'Sin proveedor'}
                            {l.costo !== null && l.costo !== undefined && ` · ${formatearMoneda(Number(l.costo))} c/u`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={valor}
                            onChange={(e) => setEdiciones({ ...ediciones, [l.id]: e.target.value })}
                            className="w-20 bg-[#161922] border border-gray-700 rounded-lg px-2 py-1 text-white text-sm text-right"
                          />
                          <button
                            onClick={() => handleGuardarLote(l)}
                            disabled={guardando || ediciones[l.id] === undefined || ediciones[l.id] === String(l.cantidad)}
                            className="text-blue-400 hover:text-blue-300 disabled:opacity-30 text-xs font-medium"
                          >
                            Guardar
                          </button>
                          {l.vencimiento === null && (
                            <button
                              onClick={() => empezarAsignar(l)}
                              className="text-amber-400 hover:text-amber-300 text-xs font-medium"
                            >
                              Asignar vencimiento
                            </button>
                          )}
                        </div>
                      </div>

                      {asignandoId === l.id && (
                        <form
                          onSubmit={(e) => handleAsignar(e, l)}
                          className="mt-3 pt-3 border-t border-gray-800"
                        >
                          <p className="text-gray-300 text-xs mb-2">
                            Pasa unidades de &quot;Sin vencimiento&quot; a un lote con fecha. El stock total no cambia.
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-gray-400">Vencimiento</label>
                              <input
                                type="month"
                                value={asigMes}
                                onChange={(e) => setAsigMes(e.target.value)}
                                className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-2 py-2 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Cantidad (máx. {l.cantidad})</label>
                              <input
                                type="number"
                                min="1"
                                max={l.cantidad}
                                value={asigCant}
                                onChange={(e) => setAsigCant(e.target.value)}
                                className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-2 py-2 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Nº de lote (opc.)</label>
                              <input
                                value={asigNum}
                                onChange={(e) => setAsigNum(e.target.value)}
                                placeholder={l.numero_lote ?? ''}
                                className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-2 py-2 text-white text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              type="submit"
                              disabled={guardando}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
                            >
                              {guardando ? 'Guardando...' : 'Asignar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setAsignandoId(null)}
                              className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm py-2 rounded-lg"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleAgregar} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
              <p className="text-gray-300 text-sm font-medium mb-1">Ingreso de mercadería nueva</p>
              <p className="text-gray-500 text-xs mb-2">
                Esto SUMA al stock. Para ponerle fecha a lo que ya tenés, usá &quot;Asignar vencimiento&quot; arriba.
              </p>
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
                <div>
                  <label className="text-xs text-gray-400">Nº de lote (opcional)</label>
                  <input
                    value={nuevoNumero}
                    onChange={(e) => setNuevoNumero(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Costo por unidad (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400">Proveedor (opcional)</label>
                  <select
                    value={nuevoProveedor}
                    onChange={(e) => setNuevoProveedor(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Si ya existe un lote con el mismo vencimiento, nº de lote y proveedor, se suma a ese. Si cambia alguno, queda separado.
              </p>
              <button
                type="submit"
                disabled={guardando}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
              >
                {guardando ? 'Guardando...' : 'Ingresar mercadería'}
              </button>
            </form>

            {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
