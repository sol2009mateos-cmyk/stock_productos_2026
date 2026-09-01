'use client'

import { useState } from 'react'
import { formatearMoneda } from '@/lib/utils'

type Producto = {
  id: string
  nombre: string
  categoria: string | null
  precio: number
  stock: number
  codigo_barras: string | null
}

export default function ListaProductosPOS({
  productos,
  busqueda,
  onAgregar,
}: {
  productos: Producto[]
  busqueda: string
  onAgregar: (producto: Producto) => void
}) {
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Todas')

  const categorias = [
    'Todas',
    ...Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean) as string[])).sort(),
  ]

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva
    return coincideBusqueda && coincideCategoria
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaActiva(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg ${
              categoriaActiva === cat
                ? 'bg-blue-600 text-white'
                : 'bg-[#0f1117] text-gray-400 hover:bg-gray-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {productosFiltrados.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-[#0f1117] rounded-lg p-3"
          >
            <div>
              <p className="text-gray-200 font-medium text-sm">{p.nombre}</p>
              <p className="text-blue-400 text-sm">{formatearMoneda(p.precio)}</p>
              <p className="text-gray-500 text-xs">Stock: {p.stock}</p>
            </div>
            <button
              onClick={() => onAgregar(p)}
              disabled={p.stock <= 0}
              className="bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-2 rounded-lg"
            >
              Agregar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
