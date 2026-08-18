'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
}

type ComboItem = {
  producto_id: string
  cantidad: number
  productos: Producto | null
}

type Combo = {
  id: string
  nombre: string
  combo_items: ComboItem[]
}

type Favorito = {
  id: number
  producto_id: string | null
  combo_id: string | null
  productos: Producto | null
  combos: Combo | null
}

export type ItemParaCarrito = { producto: Producto; cantidad: number }

export default function Favoritos({
  favoritosIniciales,
  productos,
  onAgregarVarios,
}: {
  favoritosIniciales: Favorito[]
  productos: Producto[]
  onAgregarVarios: (items: ItemParaCarrito[]) => void
}) {
  const router = useRouter()
  const [editando, setEditando] = useState<number | null>(null)
  const [modo, setModo] = useState<'elegir' | 'individual' | 'combo'>('elegir')
  const [guardando, setGuardando] = useState(false)

  const [nombreCombo, setNombreCombo] = useState('')
  const [itemsCombo, setItemsCombo] = useState<{ producto: Producto; cantidad: number }[]>([])

  const slots = Array.from({ length: 8 }, (_, i) => {
    const numero = i + 1
    const existente = favoritosIniciales.find((f) => f.id === numero)
    return { numero, favorito: existente ?? null }
  })

  function abrirEdicion(numero: number) {
    setEditando(numero)
    setModo('elegir')
    setNombreCombo('')
    setItemsCombo([])
  }

  function cerrarEdicion() {
    setEditando(null)
    setModo('elegir')
  }

  async function asignarProductoIndividual(slot: number, productoId: string) {
    setGuardando(true)
    await supabase
      .from('favoritos')
      .upsert({ id: slot, producto_id: productoId, combo_id: null })
    setGuardando(false)
    cerrarEdicion()
    router.refresh()
  }

  function agregarProductoAlCombo(producto: Producto) {
    setItemsCombo((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id)
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  function cambiarCantidadCombo(productoId: string, delta: number) {
    setItemsCombo((prev) =>
      prev
        .map((i) =>
          i.producto.id === productoId ? { ...i, cantidad: i.cantidad + delta } : i
        )
        .filter((i) => i.cantidad > 0)
    )
  }

  async function guardarCombo(slot: number) {
    if (!nombreCombo.trim() || itemsCombo.length === 0) return
    setGuardando(true)

    const { data: comboCreado, error: errorCombo } = await supabase
      .from('combos')
      .insert({ nombre: nombreCombo })
      .select()
      .single()

    if (errorCombo || !comboCreado) {
      setGuardando(false)
      return
    }

    const items = itemsCombo.map((i) => ({
      combo_id: comboCreado.id,
      producto_id: i.producto.id,
      cantidad: i.cantidad,
    }))

    await supabase.from('combo_items').insert(items)

    await supabase
      .from('favoritos')
      .upsert({ id: slot, combo_id: comboCreado.id, producto_id: null })

    setGuardando(false)
    cerrarEdicion()
    router.refresh()
  }

  async function quitarFavorito(slot: number) {
    setGuardando(true)
    await supabase.from('favoritos').delete().eq('id', slot)
    setGuardando(false)
    cerrarEdicion()
    router.refresh()
  }

  function handleClicSlot(favorito: Favorito | null) {
    if (!favorito) return
    if (favorito.productos) {
      onAgregarVarios([{ producto: favorito.productos, cantidad: 1 }])
    } else if (favorito.combos) {
      const items = (favorito.combos.combo_items ?? [])
        .filter((i) => i.productos)
        .map((i) => ({ producto: i.productos as Producto, cantidad: i.cantidad }))
      onAgregarVarios(items)
    }
  }

  return (
    <div className="mb-6">
      <h2 className="text-white font-semibold mb-3">⭐ Favoritos</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {slots.map(({ numero, favorito }) => {
          const esCombo = !!favorito?.combos
          const etiqueta = favorito?.productos?.nombre ?? favorito?.combos?.nombre ?? null
          return (
            <div key={numero} className="relative">
              <button
                onClick={() => (etiqueta ? handleClicSlot(favorito) : abrirEdicion(numero))}
                className={`w-full h-20 rounded-lg flex flex-col items-center justify-center p-2 text-center ${
                  etiqueta
                    ? esCombo
                      ? 'bg-purple-900 hover:bg-purple-800 border border-purple-600'
                      : 'bg-blue-900 hover:bg-blue-800 border border-blue-600'
                    : 'bg-[#161922] hover:bg-gray-800 border border-dashed border-gray-700'
                }`}
              >
                <span className="text-[10px] text-gray-400">
                  F{numero} {esCombo && '📦'}
                </span>
                {etiqueta ? (
                  <span className="text-white text-xs font-medium leading-tight line-clamp-2">
                    {etiqueta}
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">Vacío</span>
                )}
              </button>
              <button
                onClick={() => abrirEdicion(numero)}
                className="absolute -top-1 -right-1 bg-gray-700 hover:bg-gray-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center"
                title="Editar"
              >
                ✏️
              </button>
            </div>
          )
        })}
      </div>

      {editando !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Editar F{editando}</h3>
              <button onClick={cerrarEdicion} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>

            {modo === 'elegir' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setModo('individual')}
                  className="text-left text-sm text-gray-200 hover:bg-gray-800 px-3 py-3 rounded-lg border border-gray-800"
                >
                  🔹 Producto individual
                </button>
                <button
                  onClick={() => setModo('combo')}
                  className="text-left text-sm text-gray-200 hover:bg-gray-800 px-3 py-3 rounded-lg border border-gray-800"
                >
                  📦 Armar combo
                </button>
                <button
                  onClick={() => quitarFavorito(editando)}
                  disabled={guardando}
                  className="text-red-400 hover:text-red-300 text-sm py-2 mt-2"
                >
                  🗑️ Quitar favorito
                </button>
              </div>
            )}

            {modo === 'individual' && (
              <div>
                <div className="max-h-64 overflow-y-auto flex flex-col gap-1 mb-3">
                  {productos.map((p) => (
                    <button
                      key={p.id}
                      disabled={guardando}
                      onClick={() => asignarProductoIndividual(editando, p.id)}
                      className="text-left text-sm text-gray-200 hover:bg-gray-800 px-3 py-2 rounded-lg"
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setModo('elegir')}
                  className="text-gray-400 hover:text-gray-300 text-xs"
                >
                  ← Volver
                </button>
              </div>
            )}

            {modo === 'combo' && (
              <div>
                <input
                  value={nombreCombo}
                  onChange={(e) => setNombreCombo(e.target.value)}
                  placeholder="Nombre del combo (ej: Combo Asado)"
                  className="w-full mb-3 bg-[#0f1117] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                />

                <p className="text-xs text-gray-400 mb-2">Productos en el combo:</p>
                <div className="flex flex-col gap-1 mb-3 max-h-32 overflow-y-auto">
                  {itemsCombo.length === 0 && (
                    <p className="text-gray-600 text-xs">Ninguno todavía.</p>
                  )}
                  {itemsCombo.map((i) => (
                    <div
                      key={i.producto.id}
                      className="flex justify-between items-center bg-[#0f1117] px-3 py-2 rounded-lg"
                    >
                      <span className="text-gray-200 text-xs">{i.producto.nombre}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => cambiarCantidadCombo(i.producto.id, -1)}
                          className="bg-gray-800 hover:bg-gray-700 text-white w-5 h-5 rounded text-xs"
                        >
                          -
                        </button>
                        <span className="text-white text-xs w-4 text-center">{i.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidadCombo(i.producto.id, 1)}
                          className="bg-gray-800 hover:bg-gray-700 text-white w-5 h-5 rounded text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 mb-2">Agregar producto al combo:</p>
                <div className="max-h-32 overflow-y-auto flex flex-col gap-1 mb-3">
                  {productos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregarProductoAlCombo(p)}
                      className="text-left text-xs text-gray-300 hover:bg-gray-800 px-3 py-1.5 rounded-lg"
                    >
                      + {p.nombre}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => guardarCombo(editando)}
                    disabled={guardando || !nombreCombo.trim() || itemsCombo.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg"
                  >
                    {guardando ? 'Guardando...' : 'Guardar combo'}
                  </button>
                  <button
                    onClick={() => setModo('elegir')}
                    className="text-gray-400 hover:text-gray-300 text-xs px-3"
                  >
                    ← Volver
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
