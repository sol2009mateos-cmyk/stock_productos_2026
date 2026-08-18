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

type Favorito = {
  id: number
  producto_id: string | null
  productos: Producto | null
}

export default function Favoritos({
  favoritosIniciales,
  productos,
  onAgregarAlCarrito,
}: {
  favoritosIniciales: Favorito[]
  productos: Producto[]
  onAgregarAlCarrito: (producto: Producto) => void
}) {
  const router = useRouter()
  const [editando, setEditando] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)

  const slots = Array.from({ length: 8 }, (_, i) => {
    const numero = i + 1
    const existente = favoritosIniciales.find((f) => f.id === numero)
    return { numero, favorito: existente ?? null }
  })

  async function asignarProducto(slot: number, productoId: string) {
    setGuardando(true)
    await supabase.from('favoritos').upsert({ id: slot, producto_id: productoId })
    setGuardando(false)
    setEditando(null)
    router.refresh()
  }

  async function quitarFavorito(slot: number) {
    setGuardando(true)
    await supabase.from('favoritos').delete().eq('id', slot)
    setGuardando(false)
    setEditando(null)
    router.refresh()
  }

  return (
    <div className="mb-6">
      <h2 className="text-white font-semibold mb-3">⭐ Favoritos</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {slots.map(({ numero, favorito }) => {
          const producto = favorito?.productos ?? null
          return (
            <div key={numero} className="relative">
              <button
                onClick={() => {
                  if (producto) {
                    onAgregarAlCarrito(producto)
                  } else {
                    setEditando(numero)
                  }
                }}
                className={`w-full h-20 rounded-lg flex flex-col items-center justify-center p-2 text-center ${
                  producto
                    ? 'bg-blue-900 hover:bg-blue-800 border border-blue-600'
                    : 'bg-[#161922] hover:bg-gray-800 border border-dashed border-gray-700'
                }`}
              >
                <span className="text-[10px] text-gray-400">F{numero}</span>
                {producto ? (
                  <>
                    <span className="text-white text-xs font-medium leading-tight line-clamp-2">
                      {producto.nombre}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-600 text-xs">Vacío</span>
                )}
              </button>
              <button
                onClick={() => setEditando(numero)}
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
          <div className="bg-[#161922] border border-gray-800 rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">Asignar producto a F{editando}</h3>
              <button
                onClick={() => setEditando(null)}
                className="text-gray-500 hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
              {productos.map((p) => (
                <button
                  key={p.id}
                  disabled={guardando}
                  onClick={() => asignarProducto(editando, p.id)}
                  className="text-left text-sm text-gray-200 hover:bg-gray-800 px-3 py-2 rounded-lg"
                >
                  {p.nombre}
                </button>
              ))}
            </div>

            <button
              onClick={() => quitarFavorito(editando)}
              disabled={guardando}
              className="w-full mt-3 text-red-400 hover:text-red-300 text-sm py-2"
            >
              🗑️ Quitar favorito
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
