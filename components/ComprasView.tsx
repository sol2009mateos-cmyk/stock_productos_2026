'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatearMoneda } from '@/lib/utils'

type CompraItem = {
  cantidad: number
  costo_unitario: number
  subtotal: number
  productos: { nombre: string } | null
}

type Compra = {
  id: string
  fecha: string
  total: number
  notas: string | null
  proveedores: { nombre: string } | null
  compra_items: CompraItem[]
}

type Producto = {
  id: string
  nombre: string
  stock: number
  costo: number | null
}

type Proveedor = {
  id: string
  nombre: string
}

type Linea = {
  producto_id: string
  cantidad: string
  costo: string
}

// Mismo cálculo que hace la base de datos al registrar la compra.
function costoPromedio(stock: number, costoActual: number | null, cantidad: number, costoNuevo: number) {
  if (costoActual === null || costoActual === undefined || stock <= 0) return costoNuevo
  return Math.round(((stock * Number(costoActual) + cantidad * costoNuevo) / (stock + cantidad)) * 100) / 100
}

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ComprasView({
  compras,
  productos,
  proveedores,
}: {
  compras: Compra[]
  productos: Producto[]
  proveedores: Proveedor[]
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [compraDetalle, setCompraDetalle] = useState<Compra | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [proveedorId, setProveedorId] = useState('')
  const [notas, setNotas] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([])

  function abrirNueva() {
    setProveedorId('')
    setNotas('')
    setBusqueda('')
    setLineas([])
    setErrorMsg('')
    setAbierto(true)
  }

  function agregarProducto(p: Producto) {
    if (lineas.some((l) => l.producto_id === p.id)) {
      setBusqueda('')
      return
    }
    setLineas([...lineas, { producto_id: p.id, cantidad: '1', costo: '' }])
    setBusqueda('')
  }

  function actualizarLinea(id: string, campo: 'cantidad' | 'costo', valor: string) {
    setLineas(lineas.map((l) => (l.producto_id === id ? { ...l, [campo]: valor } : l)))
  }

  function quitarLinea(id: string) {
    setLineas(lineas.filter((l) => l.producto_id !== id))
  }

  const resultadosBusqueda =
    busqueda.trim().length === 0
      ? []
      : productos
          .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
          .slice(0, 8)

  const totalCompra = lineas.reduce((acc, l) => {
    const c = parseInt(l.cantidad, 10)
    const k = parseFloat(l.costo)
    return !isNaN(c) && !isNaN(k) ? acc + c * k : acc
  }, 0)

  async function handleGuardar() {
    setErrorMsg('')

    if (lineas.length === 0) {
      setErrorMsg('Agregá al menos un producto.')
      return
    }

    const items = []
    for (const l of lineas) {
      const cantidad = parseInt(l.cantidad, 10)
      const costo = parseFloat(l.costo)
      const nombre = productos.find((p) => p.id === l.producto_id)?.nombre ?? 'un producto'
      if (isNaN(cantidad) || cantidad <= 0) {
        setErrorMsg(`La cantidad de "${nombre}" tiene que ser mayor a 0.`)
        return
      }
      if (isNaN(costo) || costo < 0) {
        setErrorMsg(`Cargá el costo de "${nombre}" (no puede ser negativo).`)
        return
      }
      items.push({ producto_id: l.producto_id, cantidad, costo_unitario: costo })
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('registrar_compra', {
      p_proveedor_id: proveedorId || null,
      p_notas: notas || null,
      p_items: items,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    setAbierto(false)
    router.refresh()
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">📥 Compras</h1>
          <p className="text-gray-500 text-sm mt-1">{compras.length} compras registradas</p>
        </div>
        <button
          onClick={abrirNueva}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          + Nueva compra
        </button>
      </div>

      <div className="bg-[#161922] rounded-lg p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Fecha</th>
              <th className="pb-2">Proveedor</th>
              <th className="pb-2 text-right">Productos</th>
              <th className="pb-2 text-right">Total</th>
              <th className="pb-2 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((c) => (
              <tr key={c.id} className="border-b border-gray-800">
                <td className="py-3 text-gray-300">{formatearFecha(c.fecha)}</td>
                <td className="py-3 text-gray-300">{c.proveedores?.nombre ?? '—'}</td>
                <td className="py-3 text-right text-gray-400">{c.compra_items?.length ?? 0}</td>
                <td className="py-3 text-right text-gray-200 font-medium">{formatearMoneda(Number(c.total))}</td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setCompraDetalle(c)}
                    className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {compras.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Todavía no registraste compras.</p>
        )}
      </div>

      {compraDetalle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-white font-semibold text-lg">Detalle de la compra</h2>
              <button onClick={() => setCompraDetalle(null)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              {formatearFecha(compraDetalle.fecha)} · {compraDetalle.proveedores?.nombre ?? 'Sin proveedor'}
            </p>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-800">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-right">Cant.</th>
                  <th className="pb-2 text-right">Costo</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {compraDetalle.compra_items.map((i, idx) => (
                  <tr key={idx} className="border-b border-gray-800">
                    <td className="py-2 text-gray-300">{i.productos?.nombre ?? 'Producto eliminado'}</td>
                    <td className="py-2 text-right text-gray-400">{i.cantidad}</td>
                    <td className="py-2 text-right text-gray-400">{formatearMoneda(Number(i.costo_unitario))}</td>
                    <td className="py-2 text-right text-gray-200">{formatearMoneda(Number(i.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between text-white font-semibold">
              <span>Total</span>
              <span>{formatearMoneda(Number(compraDetalle.total))}</span>
            </div>
            {compraDetalle.notas && <p className="text-gray-500 text-sm mt-3">Notas: {compraDetalle.notas}</p>}
          </div>
        </div>
      )}

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">Nueva compra</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400">Proveedor (opcional)</label>
                <select
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Notas (opcional)</label>
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full mt-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                placeholder="🔍 Buscar producto para agregar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              {resultadosBusqueda.length > 0 && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-[#0f1117] border border-gray-700 rounded-lg overflow-hidden">
                  {resultadosBusqueda.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => agregarProducto(p)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 flex justify-between"
                    >
                      <span>{p.nombre}</span>
                      <span className="text-gray-500">stock {p.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lineas.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Buscá y agregá los productos que compraste.</p>
            ) : (
              <div className="flex flex-col gap-3 mb-4">
                {lineas.map((l) => {
                  const prod = productos.find((p) => p.id === l.producto_id)
                  if (!prod) return null
                  const cant = parseInt(l.cantidad, 10)
                  const costoNuevo = parseFloat(l.costo)
                  const hayDatos = !isNaN(cant) && cant > 0 && !isNaN(costoNuevo) && costoNuevo >= 0
                  const nuevoCosto = hayDatos ? costoPromedio(prod.stock, prod.costo, cant, costoNuevo) : null
                  return (
                    <div key={l.producto_id} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-gray-200 text-sm font-medium">{prod.nombre}</p>
                          <p className="text-gray-500 text-xs">
                            Stock actual: {prod.stock} · Costo actual:{' '}
                            {prod.costo !== null && prod.costo !== undefined ? formatearMoneda(Number(prod.costo)) : 'sin costo'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarLinea(l.producto_id)}
                          className="text-gray-500 hover:text-red-400 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-400">Cantidad comprada</label>
                          <input
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) => actualizarLinea(l.producto_id, 'cantidad', e.target.value)}
                            className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Costo por unidad (sin IVA)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.costo}
                            onChange={(e) => actualizarLinea(l.producto_id, 'costo', e.target.value)}
                            className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                          />
                        </div>
                      </div>
                      {nuevoCosto !== null && (
                        <p className="text-sm text-emerald-400 mt-2">
                          Stock nuevo: {prod.stock + cant} · Costo promedio nuevo: {formatearMoneda(nuevoCosto)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-between text-white font-semibold mb-3">
              <span>Total de la compra</span>
              <span>{formatearMoneda(totalCompra)}</span>
            </div>

            {errorMsg && <p className="text-red-400 text-sm mb-3">{errorMsg}</p>}

            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg"
            >
              {guardando ? 'Guardando...' : 'Confirmar compra'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
