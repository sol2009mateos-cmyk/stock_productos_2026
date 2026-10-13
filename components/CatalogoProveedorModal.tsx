'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatearMoneda } from '@/lib/utils'
import ImportarCatalogoModal from '@/components/ImportarCatalogoModal'

export type ItemCatalogo = {
  id: string
  proveedor_id: string
  nombre: string
  codigo: string | null
  precio: number | null
  precio_actualizado: string | null
  producto_id: string | null
}

export type ProductoInventario = { id: string; nombre: string }

type Edicion = { precio: string; producto_id: string }

function formatearFecha(fecha: string | null) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CatalogoProveedorModal({
  proveedor,
  items,
  productos,
}: {
  proveedor: { id: string; nombre: string }
  items: ItemCatalogo[]
  productos: ProductoInventario[]
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [ediciones, setEdiciones] = useState<Record<string, Edicion>>({})

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')

  function abrir() {
    setEdiciones({})
    setBusqueda('')
    setNuevoNombre('')
    setNuevoCodigo('')
    setNuevoPrecio('')
    setErrorMsg('')
    setAbierto(true)
  }

  function valorEdicion(it: ItemCatalogo): Edicion {
    return (
      ediciones[it.id] ?? {
        precio: it.precio !== null && it.precio !== undefined ? String(it.precio) : '',
        producto_id: it.producto_id ?? '',
      }
    )
  }

  function cambiar(it: ItemCatalogo, campo: keyof Edicion, valor: string) {
    setEdiciones({ ...ediciones, [it.id]: { ...valorEdicion(it), [campo]: valor } })
  }

  async function handleGuardar(it: ItemCatalogo) {
    setErrorMsg('')
    const ed = valorEdicion(it)
    const precio = ed.precio.trim() === '' ? null : parseFloat(ed.precio)
    if (precio !== null && (isNaN(precio) || precio < 0)) {
      setErrorMsg('El precio no puede ser negativo.')
      return
    }

    const precioCambio = (precio ?? null) !== (it.precio !== null ? Number(it.precio) : null)

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('proveedor_productos')
      .update({
        precio,
        producto_id: ed.producto_id || null,
        precio_actualizado: precioCambio ? new Date().toISOString() : it.precio_actualizado,
      })
      .eq('id', it.id)
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    const copia = { ...ediciones }
    delete copia[it.id]
    setEdiciones(copia)
    router.refresh()
  }

  async function handleEliminar(it: ItemCatalogo) {
    if (!confirm(`¿Sacar "${it.nombre}" del catálogo de ${proveedor.nombre}?`)) return
    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('proveedor_productos').delete().eq('id', it.id)
    setGuardando(false)

    if (error) {
      setErrorMsg(error.message)
      return
    }
    router.refresh()
  }

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    const nombre = nuevoNombre.trim()
    if (!nombre) {
      setErrorMsg('Escribí el nombre del producto.')
      return
    }
    const precio = nuevoPrecio.trim() === '' ? null : parseFloat(nuevoPrecio)
    if (precio !== null && (isNaN(precio) || precio < 0)) {
      setErrorMsg('El precio no puede ser negativo.')
      return
    }

    setGuardando(true)
    const supabase = createClient()
    const { error } = await supabase.from('proveedor_productos').insert({
      proveedor_id: proveedor.id,
      nombre,
      codigo: nuevoCodigo.trim() || null,
      precio,
      precio_actualizado: precio !== null ? new Date().toISOString() : null,
    })
    setGuardando(false)

    if (error) {
      setErrorMsg(
        error.message.includes('duplicate') ? 'Ese producto ya está en el catálogo de este proveedor.' : error.message
      )
      return
    }

    setNuevoNombre('')
    setNuevoCodigo('')
    setNuevoPrecio('')
    router.refresh()
  }

  const filtrados = items
    .filter((it) => it.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <>
      <button onClick={abrir} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">
        📋 Catálogo ({items.length})
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-white font-semibold text-lg">Catálogo de {proveedor.nombre}</h2>
              <button onClick={() => setAbierto(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <p className="text-gray-500 text-xs mb-4">
              Lo que vende este proveedor y a qué precio (sin IVA). El nº de lote y el vencimiento no van acá:
              cambian en cada entrega y se cargan al comprar. Vinculá cada ítem con un producto de tu inventario
              para poder comparar precios entre proveedores. Cuando confirmás una compra con este proveedor, el
              precio de ese producto se actualiza solo.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="🔍 Buscar en el catálogo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <ImportarCatalogoModal proveedor={proveedor} />
            </div>

            {filtrados.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                {items.length === 0 ? 'Este proveedor todavía no tiene productos.' : 'No se encontró nada.'}
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-4">
                {filtrados.map((it) => {
                  const ed = valorEdicion(it)
                  const sinCambios = ediciones[it.id] === undefined
                  return (
                    <div key={it.id} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-gray-200 text-sm font-medium">{it.nombre}</p>
                          <p className="text-gray-500 text-xs">
                            {it.codigo ? `Cód. ${it.codigo}` : 'Sin código'}
                            {it.precio !== null && it.precio !== undefined && it.precio_actualizado
                              ? ` · ${formatearMoneda(Number(it.precio))} al ${formatearFecha(it.precio_actualizado)}`
                              : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminar(it)}
                          disabled={guardando}
                          className="text-gray-500 hover:text-red-400 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-2 mt-2 items-end">
                        <div>
                          <label className="text-xs text-gray-400">Precio</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ed.precio}
                            onChange={(e) => cambiar(it, 'precio', e.target.value)}
                            className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Producto de mi inventario</label>
                          <select
                            value={ed.producto_id}
                            onChange={(e) => cambiar(it, 'producto_id', e.target.value)}
                            className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                          >
                            <option value="">Sin vincular</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleGuardar(it)}
                          disabled={guardando || sinCambios}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-30 text-xs font-medium pb-2"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <form onSubmit={handleAgregar} className="bg-[#0f1117] border border-gray-800 rounded-lg p-3">
              <p className="text-gray-300 text-sm font-medium mb-2">Agregar producto al catálogo</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400">Nombre del producto</label>
                  <input
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Código del proveedor (opc.)</label>
                  <input
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Precio sin IVA (opc.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    className="w-full mt-1 bg-[#161922] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={guardando}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
              >
                {guardando ? 'Guardando...' : 'Agregar al catálogo'}
              </button>
            </form>

            {errorMsg && <p className="text-red-400 text-sm mt-3">{errorMsg}</p>}
          </div>
        </div>
      )}
    </>
  )
}
